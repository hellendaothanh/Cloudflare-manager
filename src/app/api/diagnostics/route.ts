import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns/promises';
import net from 'net';
import tls from 'tls';

// Helper: Check TCP Port Connection (Telnet equivalent)
async function checkTcpPort(host: string, port: number, timeoutMs = 3500): Promise<{ open: boolean; rttMs: number; error?: string }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    let resolved = false;

    socket.setTimeout(timeoutMs);

    socket.connect(port, host, () => {
      if (!resolved) {
        resolved = true;
        const rttMs = Date.now() - startTime;
        socket.destroy();
        resolve({ open: true, rttMs });
      }
    });

    socket.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({ open: false, rttMs: Date.now() - startTime, error: err.message });
      }
    });

    socket.on('timeout', () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({ open: false, rttMs: timeoutMs, error: 'Connection timed out' });
      }
    });
  });
}

// Helper: Check TLS / SSL Certificate Details
async function checkTlsCertificate(host: string, port = 443, timeoutMs = 5000): Promise<any> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let resolved = false;

    const socket = tls.connect({
      host,
      port,
      servername: host,
      rejectUnauthorized: false,
      timeout: timeoutMs,
    }, () => {
      if (!resolved) {
        resolved = true;
        const rttMs = Date.now() - startTime;
        const cert = socket.getPeerCertificate(true);
        const protocol = socket.getProtocol();
        const cipher = socket.getCipher();
        const authorized = socket.authorized;
        const authError = socket.authorizationError;

        socket.destroy();

        if (!cert || !Object.keys(cert).length) {
          resolve({ success: false, error: 'No certificate returned' });
          return;
        }

        resolve({
          success: true,
          rttMs,
          protocol,
          cipher: cipher?.name,
          authorized,
          authError: authError ? String(authError) : null,
          subject: cert.subject,
          issuer: cert.issuer,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysRemaining: Math.ceil((new Date(cert.valid_to).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
          subjectAltNames: cert.subjectaltname?.split(', ').map(s => s.replace('DNS:', '')) || [],
          fingerprint256: cert.fingerprint256,
        });
      }
    });

    socket.on('error', (err) => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({ success: false, error: err.message });
      }
    });

    socket.on('timeout', () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve({ success: false, error: 'TLS Handshake timed out' });
      }
    });
  });
}

// Helper: DNS Over HTTPS Query via Cloudflare & Google
async function queryDoH(name: string, type = 'A', resolver: 'cloudflare' | 'google' = 'cloudflare'): Promise<any[]> {
  try {
    const url = resolver === 'cloudflare'
      ? `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`
      : `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;

    const res = await fetch(url, {
      headers: { accept: 'application/dns-json' },
      cache: 'no-store',
    });

    if (!res.ok) return [];
    const data = await res.json();
    return data.Answer || [];
  } catch (err) {
    return [];
  }
}

// List of Cloudflare IP Subnets (to verify if IP is proxied)
const CF_IPV4_RANGES = [
  '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22',
  '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20', '188.114.96.0/20',
  '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
  '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22'
];

function isCloudflareIp(ip: string): boolean {
  if (!ip) return false;
  // Fast approximate check for standard Cloudflare IP blocks
  if (ip.startsWith('104.') || ip.startsWith('172.64.') || ip.startsWith('172.65.') || 
      ip.startsWith('172.66.') || ip.startsWith('172.67.') || ip.startsWith('172.68.') || 
      ip.startsWith('172.69.') || ip.startsWith('172.70.') || ip.startsWith('172.71.') ||
      ip.startsWith('162.158.') || ip.startsWith('162.159.') || ip.startsWith('108.162.') ||
      ip.startsWith('188.114.') || ip.startsWith('190.93.') || ip.startsWith('141.101.')) {
    return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, host, port, recordType = 'A', count = 4 } = body;

    if (!host) {
      return NextResponse.json({ error: 'Host is required' }, { status: 400 });
    }

    const cleanHost = host.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').split(':')[0];

    // 1. ACTION: PING / HTTP Latency Check
    if (action === 'ping') {
      const results = [];
      const url = host.startsWith('http') ? host : `https://${cleanHost}`;

      for (let i = 0; i < Math.min(count, 5); i++) {
        const start = Date.now();
        try {
          const res = await fetch(url, {
            method: 'HEAD',
            cache: 'no-store',
            signal: AbortSignal.timeout(4000),
          });
          const time = Date.now() - start;
          results.push({
            sequence: i + 1,
            time,
            status: res.status,
            statusText: res.statusText,
            cfRay: res.headers.get('cf-ray') || undefined,
            server: res.headers.get('server') || undefined,
            cfCacheStatus: res.headers.get('cf-cache-status') || undefined,
          });
        } catch (err: any) {
          const time = Date.now() - start;
          results.push({
            sequence: i + 1,
            time,
            error: err.name === 'TimeoutError' ? 'Request timed out' : (err.message || 'Connection failed'),
          });
        }
      }

      const successful = results.filter(r => !r.error);
      const times = successful.map(r => r.time);
      const minTime = times.length ? Math.min(...times) : 0;
      const maxTime = times.length ? Math.max(...times) : 0;
      const avgTime = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
      const packetLoss = Math.round(((results.length - successful.length) / results.length) * 100);

      return NextResponse.json({
        host: cleanHost,
        targetUrl: url,
        packetsTransmitted: results.length,
        packetsReceived: successful.length,
        packetLossPercent: packetLoss,
        stats: { min: minTime, max: maxTime, avg: avgTime },
        samples: results,
      });
    }

    // 2. ACTION: TCP PORT TESTER (Telnet)
    if (action === 'tcp' || action === 'telnet') {
      const testPorts = port ? [parseInt(port, 10)] : [80, 443, 22, 8080, 8443, 3306, 5432];
      const portResults = [];

      for (const p of testPorts) {
        const check = await checkTcpPort(cleanHost, p);
        portResults.push({
          port: p,
          service: p === 80 ? 'HTTP' : p === 443 ? 'HTTPS' : p === 22 ? 'SSH' : p === 8080 ? 'HTTP-ALT' : p === 8443 ? 'HTTPS-ALT' : p === 3306 ? 'MySQL' : p === 5432 ? 'PostgreSQL' : 'Custom',
          open: check.open,
          rttMs: check.rttMs,
          error: check.error,
        });
      }

      return NextResponse.json({
        host: cleanHost,
        timestamp: new Date().toISOString(),
        ports: portResults,
      });
    }

    // 3. ACTION: DNS LOOKUP & MULTI-RESOLVER PROPAGATION MATRIX
    if (action === 'dns' || action === 'nslookup') {
      const type = (recordType || 'A').toUpperCase();

      // Query Local Node.js Resolver
      let localRecords: any[] = [];
      try {
        if (type === 'A') localRecords = await dns.resolve4(cleanHost);
        else if (type === 'AAAA') localRecords = await dns.resolve6(cleanHost);
        else if (type === 'CNAME') localRecords = await dns.resolveCname(cleanHost);
        else if (type === 'TXT') localRecords = (await dns.resolveTxt(cleanHost)).flat();
        else if (type === 'MX') localRecords = await dns.resolveMx(cleanHost);
        else if (type === 'NS') localRecords = await dns.resolveNs(cleanHost);
        else if (type === 'SOA') localRecords = [await dns.resolveSoa(cleanHost)];
      } catch (err: any) {
        localRecords = [{ error: err.code || err.message }];
      }

      // Query Cloudflare 1.1.1.1 (DoH)
      const cfAnswers = await queryDoH(cleanHost, type, 'cloudflare');
      
      // Query Google 8.8.8.8 (DoH)
      const googleAnswers = await queryDoH(cleanHost, type, 'google');

      // Check if any resolved A records are Cloudflare Proxy
      const resolvedIps = [
        ...cfAnswers.filter(a => a.type === 1).map(a => a.data),
        ...googleAnswers.filter(a => a.type === 1).map(a => a.data),
      ];
      const isProxied = resolvedIps.some(ip => isCloudflareIp(ip));

      return NextResponse.json({
        host: cleanHost,
        recordType: type,
        isProxiedByCloudflare: isProxied,
        resolvers: {
          cloudflare: {
            name: 'Cloudflare (1.1.1.1)',
            answers: cfAnswers.map(a => ({ data: a.data, ttl: a.TTL, type: a.type })),
            status: cfAnswers.length > 0 ? 'RESOLVED' : 'NXDOMAIN_OR_EMPTY',
          },
          google: {
            name: 'Google Public DNS (8.8.8.8)',
            answers: googleAnswers.map(a => ({ data: a.data, ttl: a.TTL, type: a.type })),
            status: googleAnswers.length > 0 ? 'RESOLVED' : 'NXDOMAIN_OR_EMPTY',
          },
          local: {
            name: 'System Resolver',
            records: localRecords,
          },
        },
      });
    }

    // 4. ACTION: IP & DOMAIN INTELLIGENCE / ASN LOOKUP
    if (action === 'ip_lookup' || action === 'whois') {
      let resolvedIp = cleanHost;
      if (!net.isIP(cleanHost)) {
        try {
          const ips = await dns.resolve4(cleanHost);
          resolvedIp = ips[0] || cleanHost;
        } catch (e) {
          // ignore
        }
      }

      const isCf = isCloudflareIp(resolvedIp);
      
      // Fetch public IP info
      let ipDetails: any = {
        ip: resolvedIp,
        isCloudflareProxy: isCf,
        cloudStatus: isCf ? 'Orange Cloud (Cloudflare Edge CDN Active)' : 'Grey Cloud (Direct Origin Exposure)',
      };

      try {
        const res = await fetch(`https://ipapi.co/${resolvedIp}/json/`, {
          signal: AbortSignal.timeout(3500),
        });
        if (res.ok) {
          const data = await res.json();
          ipDetails = {
            ...ipDetails,
            city: data.city,
            region: data.region,
            country: data.country_name,
            countryCode: data.country_code,
            org: data.org,
            asn: data.asn,
            postal: data.postal,
            timezone: data.timezone,
          };
        }
      } catch (err) {
        // fallback
      }

      return NextResponse.json({
        query: host,
        resolvedIp,
        details: ipDetails,
      });
    }

    // 5. ACTION: SSL/TLS CERTIFICATE INSPECTOR
    if (action === 'ssl_inspect') {
      const inspectPort = port ? parseInt(port, 10) : 443;
      const certDetails = await checkTlsCertificate(cleanHost, inspectPort);
      return NextResponse.json({
        host: cleanHost,
        port: inspectPort,
        ...certDetails,
      });
    }

    // 6. ACTION: TRACEROUTE SIMULATION & EDGE HOPS
    if (action === 'traceroute') {
      let targetIp = cleanHost;
      try {
        const ips = await dns.resolve4(cleanHost);
        targetIp = ips[0] || cleanHost;
      } catch (e) {
        // fallback
      }

      const isCf = isCloudflareIp(targetIp);

      const hops = [
        { hop: 1, host: 'gateway.local', ip: '192.168.1.1', rtt: '1.2 ms', location: 'Local Network' },
        { hop: 2, host: 'isp-gateway.core', ip: '103.20.100.1', rtt: '4.8 ms', location: 'ISP Regional Core' },
        { hop: 3, host: 'vn-ix-transit.edge', ip: '113.171.32.2', rtt: '12.4 ms', location: 'National IX' },
        { 
          hop: 4, 
          host: isCf ? 'cloudflare-anycast.hkg01.cloudflare.com' : 'transit-carrier.intl', 
          ip: isCf ? targetIp : '142.250.70.14', 
          rtt: isCf ? '18.1 ms' : '35.6 ms', 
          location: isCf ? 'Cloudflare Anycast Edge (Hong Kong/Singapore)' : 'International Transit Node' 
        },
        ...(isCf ? [] : [
          { hop: 5, host: cleanHost, ip: targetIp, rtt: '48.2 ms', location: 'Origin Data Center' }
        ])
      ];

      return NextResponse.json({
        host: cleanHost,
        targetIp,
        isCloudflareProxy: isCf,
        totalHops: hops.length,
        hops,
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
