import { SecurityAuditResult, Zone, DnsRecord } from "@/types/cloudflare";

export function evaluateZoneSecurity(params: {
  zone: Zone;
  sslMode?: string;
  minTlsVersion?: string;
  alwaysUseHttps?: boolean;
  hstsEnabled?: boolean;
  dnssecStatus?: string;
  wafRulesCount?: number;
  ipRulesCount?: number;
  dnsRecords?: DnsRecord[];
  securityLevel?: string;
  lang?: 'vi' | 'en';
}): SecurityAuditResult {
  const {
    zone,
    sslMode = 'flexible',
    minTlsVersion = '1.0',
    alwaysUseHttps = false,
    hstsEnabled = false,
    dnssecStatus = 'disabled',
    wafRulesCount = 0,
    ipRulesCount = 0,
    dnsRecords = [],
    securityLevel = 'medium',
    lang = 'vi'
  } = params;

  const isEn = lang === 'en';
  const checks: SecurityAuditResult['checks'] = [];
  let score = 0;

  // 1. SSL/TLS Strict Mode Check (Weight: 25 pts)
  if (sslMode === 'strict') {
    score += 25;
    checks.push({
      id: 'ssl-mode',
      title: isEn ? 'SSL/TLS Encryption Mode (Full Strict)' : 'Chế độ mã hóa SSL/TLS (Full Strict)',
      category: 'SSL/TLS',
      severity: 'critical',
      passed: true,
      current_value: 'Full (Strict)',
      recommended_value: 'Full (Strict)',
      description: isEn
        ? 'Traffic between Cloudflare and origin server is end-to-end encrypted with a valid, trusted SSL certificate.'
        : 'Giao tiếp giữa Cloudflare và máy chủ gốc được mã hóa đầu cuối với chứng chỉ SSL hợp lệ.',
    });
  } else if (sslMode === 'full') {
    score += 15;
    checks.push({
      id: 'ssl-mode',
      title: isEn ? 'SSL/TLS Encryption Mode (Full)' : 'Chế độ mã hóa SSL/TLS (Full)',
      category: 'SSL/TLS',
      severity: 'medium',
      passed: false,
      current_value: 'Full',
      recommended_value: 'Full (Strict)',
      description: isEn
        ? 'Origin server SSL certificate is not strictly validated (potential Man-in-the-Middle risk). Upgrade to Full (Strict).'
        : 'Chứng chỉ máy chủ gốc chưa được xác thực tính hợp lệ (nguy cơ Man-in-the-Middle). Nên nâng cấp lên Full (Strict).',
      remediation_action: isEn ? 'Upgrade SSL Mode to "Full (Strict)"' : 'Nâng cấp SSL Mode thành "Full (Strict)"',
    });
  } else {
    checks.push({
      id: 'ssl-mode',
      title: isEn ? 'Insecure SSL/TLS Encryption Mode (Off / Flexible)' : 'Chế độ mã hóa SSL/TLS không an toàn (Off / Flexible)',
      category: 'SSL/TLS',
      severity: 'critical',
      passed: false,
      current_value: sslMode.toUpperCase(),
      recommended_value: 'Full (Strict)',
      description: isEn
        ? 'Traffic from Cloudflare to origin server is unencrypted plain text HTTP! Highly vulnerable to interception.'
        : 'Lưu lượng từ Cloudflare tới Origin server đang truyền không mã hóa (HTTP plain text), cực kỳ nguy hiểm cho dữ liệu người dùng!',
      remediation_action: isEn ? 'Install SSL cert on origin and switch mode to "Full (Strict)"' : 'Cài đặt chứng chỉ SSL trên Origin và đổi SSL Mode sang "Full (Strict)"',
    });
  }

  // 2. Minimum TLS Version Check (Weight: 15 pts)
  const tlsNum = parseFloat(minTlsVersion.replace('TLS ', '')) || 1.0;
  if (tlsNum >= 1.3) {
    score += 15;
    checks.push({
      id: 'min-tls',
      title: isEn ? 'Minimum TLS Version (TLS 1.3)' : 'Phiên bản TLS tối thiểu (TLS 1.3)',
      category: 'SSL/TLS',
      severity: 'high',
      passed: true,
      current_value: `TLS ${tlsNum}`,
      recommended_value: isEn ? 'TLS 1.2 or TLS 1.3' : 'TLS 1.2 hoặc TLS 1.3',
      description: isEn
        ? 'Enforces the latest cryptographic ciphers and eliminates insecure legacy protocols.'
        : 'Tuân thủ các thuật toán mã hóa hiện đại nhất, loại bỏ các cipher yếu.',
    });
  } else if (tlsNum >= 1.2) {
    score += 12;
    checks.push({
      id: 'min-tls',
      title: isEn ? 'Minimum TLS Version (TLS 1.2)' : 'Phiên bản TLS tối thiểu (TLS 1.2)',
      category: 'SSL/TLS',
      severity: 'medium',
      passed: true,
      current_value: 'TLS 1.2',
      recommended_value: 'TLS 1.3',
      description: isEn
        ? 'Meets standard industry security baselines. Consider upgrading to TLS 1.3.'
        : 'Đạt chuẩn bảo mật tiêu chuẩn ngành. Có thể xem xét nâng lên TLS 1.3.',
    });
  } else {
    checks.push({
      id: 'min-tls',
      title: isEn ? 'Legacy Insecure TLS Version (TLS 1.0 / 1.1)' : 'Phiên bản TLS cũ lỗi thời (TLS 1.0 / 1.1)',
      category: 'SSL/TLS',
      severity: 'critical',
      passed: false,
      current_value: `TLS ${tlsNum}`,
      recommended_value: 'TLS 1.2+',
      description: isEn
        ? 'TLS 1.0/1.1 has known vulnerabilities (POODLE, BEAST) and violates PCI-DSS compliance.'
        : 'TLS 1.0/1.1 có nhiều lỗ hổng đã biết (POODLE, BEAST) và không đạt chuẩn PCI-DSS.',
      remediation_action: isEn ? 'Set Minimum TLS Version to TLS 1.2 or TLS 1.3' : 'Đặt Minimum TLS Version thành TLS 1.2 hoặc TLS 1.3',
    });
  }

  // 3. Always Use HTTPS (Weight: 15 pts)
  if (alwaysUseHttps) {
    score += 15;
    checks.push({
      id: 'always-https',
      title: isEn ? 'Always Use HTTPS Redirection' : 'Luôn luôn chuyển hướng sang HTTPS',
      category: 'Headers',
      severity: 'high',
      passed: true,
      current_value: isEn ? 'Enabled' : 'Đã bật',
      recommended_value: isEn ? 'Enabled' : 'Đã bật',
      description: isEn
        ? 'All insecure HTTP requests are automatically redirected to secure HTTPS with 301 status.'
        : 'Mọi request HTTP tự động redirect 301 sang HTTPS an toàn.',
    });
  } else {
    checks.push({
      id: 'always-https',
      title: isEn ? 'Always Use HTTPS is Disabled' : 'Chưa bật ép buộc Always Use HTTPS',
      category: 'Headers',
      severity: 'high',
      passed: false,
      current_value: isEn ? 'Disabled' : 'Chưa bật',
      recommended_value: isEn ? 'Enabled' : 'Đã bật',
      description: isEn
        ? 'Visitors can access the site over unencrypted HTTP, leaving data in cleartext.'
        : 'Người dùng có thể truy cập qua HTTP không được mã hóa.',
      remediation_action: isEn ? 'Enable "Always Use HTTPS" in SSL/TLS settings' : 'Kích hoạt "Always Use HTTPS" trong cài đặt SSL/TLS',
    });
  }

  // 4. HSTS (HTTP Strict Transport Security) (Weight: 15 pts)
  if (hstsEnabled) {
    score += 15;
    checks.push({
      id: 'hsts',
      title: isEn ? 'HSTS Policy (HTTP Strict Transport Security)' : 'Chính sách HSTS (HTTP Strict Transport Security)',
      category: 'Headers',
      severity: 'high',
      passed: true,
      current_value: isEn ? 'Enabled' : 'Đã kích hoạt',
      recommended_value: isEn ? 'Enabled' : 'Đã kích hoạt',
      description: isEn
        ? 'Prevents SSL Stripping attacks by enforcing browser HTTPS-only communication.'
        : 'Ngăn chặn hoàn toàn các cuộc tấn công SSL Stripping tại trình duyệt.',
    });
  } else {
    checks.push({
      id: 'hsts',
      title: isEn ? 'HSTS Policy Not Configured' : 'Chưa cấu hình tiêu đề HSTS',
      category: 'Headers',
      severity: 'high',
      passed: false,
      current_value: isEn ? 'Disabled' : 'Chưa bật',
      recommended_value: isEn ? 'Enabled (Max-age > 6 months)' : 'Đã kích hoạt (Max-age > 6 tháng)',
      description: isEn
        ? 'Browsers do not strictly remember HTTPS requirements, exposing first-load sessions.'
        : 'Trình duyệt của khách truy cập không ghi nhớ chứng chỉ bắt buộc.',
      remediation_action: isEn ? 'Configure HSTS with minimum 6 months max-age and includeSubdomains' : 'Cấu hình HSTS với max-age tối thiểu 6 tháng và includeSubdomains',
    });
  }

  // 5. DNSSEC Protection (Weight: 15 pts)
  if (dnssecStatus === 'active') {
    score += 15;
    checks.push({
      id: 'dnssec',
      title: isEn ? 'DNSSEC Cryptographic Signature' : 'Chữ ký số DNSSEC',
      category: 'DNS',
      severity: 'high',
      passed: true,
      current_value: 'Active',
      recommended_value: 'Active',
      description: isEn
        ? 'Authenticates DNS response integrity, protecting against DNS spoofing and cache poisoning.'
        : 'Xác thực tính toàn vẹn bản ghi DNS, chống tấn công DNS Spoofing và Cache Poisoning.',
    });
  } else {
    checks.push({
      id: 'dnssec',
      title: isEn ? 'DNSSEC Not Activated on Domain' : 'Chưa kích hoạt DNSSEC cho tên miền',
      category: 'DNS',
      severity: 'medium',
      passed: false,
      current_value: dnssecStatus.toUpperCase(),
      recommended_value: 'Active',
      description: isEn
        ? 'Domain is not protected with DNSSEC cryptographic signatures.'
        : 'Tên miền chưa được bảo vệ bằng chữ ký mật mã DNSSEC.',
      remediation_action: isEn ? 'Enable DNSSEC and add DS records at your Registrar' : 'Bật DNSSEC và thêm bản ghi DS vào Registrar của bạn',
    });
  }

  // 6. WAF & Firewall Rules Configuration (Weight: 10 pts)
  if (wafRulesCount > 0 || ipRulesCount > 0) {
    score += 10;
    checks.push({
      id: 'waf-active',
      title: isEn ? 'WAF & IP Access Firewall Rules' : 'Quy tắc tường lửa WAF & IP Access',
      category: 'WAF',
      severity: 'medium',
      passed: true,
      current_value: isEn
        ? `${wafRulesCount} WAF Rules, ${ipRulesCount} IP Rules`
        : `${wafRulesCount} WAF Rules, ${ipRulesCount} IP Rules`,
      recommended_value: isEn ? 'At least 1 active rule' : 'Tối thiểu 1 quy tắc chủ động',
      description: isEn
        ? 'Custom edge rules are deployed to filter bad bots and suspicious traffic.'
        : 'Hạ tầng đã có quy tắc tùy biến để lọc bot độc hại và chặn lưu lượng nghi vấn.',
    });
  } else {
    checks.push({
      id: 'waf-active',
      title: isEn ? 'No Custom WAF or IP Access Rules' : 'Chưa có Custom WAF hoặc IP Access Rules',
      category: 'WAF',
      severity: 'medium',
      passed: false,
      current_value: isEn ? '0 rules' : '0 quy tắc',
      recommended_value: isEn ? 'Create rules protecting sensitive paths (e.g., /admin, /api)' : 'Tạo quy tắc bảo vệ các URL nhạy cảm (vd: /admin, /wp-login, /api)',
      description: isEn
        ? 'Custom WAF rules should be configured for management portals and API endpoints.'
        : 'Nên thiết lập các quy tắc WAF cụ thể cho trang quản trị hoặc API.',
      remediation_action: isEn ? 'Create WAF or Rate Limiting rules for critical endpoints' : 'Tạo quy tắc WAF hoặc Rate Limiting cho các endpoints quan trọng',
    });
  }

  // 7. Unproxied Origin IP Leaks in DNS (Weight: 5 pts)
  const exposedOrigins = dnsRecords.filter(r => (r.type === 'A' || r.type === 'AAAA') && !r.proxied && (r.name.includes('api') || r.name.includes('admin') || r.name.includes('app')));
  if (exposedOrigins.length === 0) {
    score += 5;
    checks.push({
      id: 'dns-proxy-exposure',
      title: isEn ? 'Origin IP Shielding (Proxy Coverage)' : 'Ẩn IP máy chủ gốc (Origin IP Shielding)',
      category: 'DNS',
      severity: 'high',
      passed: true,
      current_value: isEn ? 'No sensitive origin IP leak detected' : 'Không phát hiện lộ IP nhạy cảm',
      recommended_value: isEn ? 'Enable Proxy (Orange Cloud) for all web services' : 'Bật Proxy (Orange Cloud) cho tất cả web services',
      description: isEn
        ? 'Critical web records are protected behind Cloudflare CDN Proxy.'
        : 'Các bản ghi Web chính đã được ẩn IP thật thông qua Cloudflare Proxy.',
    });
  } else {
    checks.push({
      id: 'dns-proxy-exposure',
      title: isEn ? 'Sensitive DNS Records Unproxied (Grey Cloud)' : 'Phát hiện bản ghi DNS nhạy cảm chưa bật Cloudflare Proxy',
      category: 'DNS',
      severity: 'high',
      passed: false,
      current_value: isEn ? `${exposedOrigins.length} records (Grey Cloud)` : `${exposedOrigins.length} bản ghi (Grey Cloud)`,
      recommended_value: isEn ? 'Enable Proxy (Orange Cloud)' : 'Bật Proxy (Orange Cloud)',
      description: isEn
        ? `Records (${exposedOrigins.map(r => r.name).slice(0, 3).join(', ')}) expose direct origin server IP, risking direct DDoS bypass.`
        : `Bản ghi (${exposedOrigins.map(r => r.name).slice(0, 3).join(', ')}) đang để lộ IP thật của Origin server, có thể bị DDoS trực tiếp bypass qua Cloudflare.`,
      remediation_action: isEn ? 'Enable Proxy (Orange Cloud) for web records or use internal IPs' : 'Bật Proxy (Orange Cloud) cho các bản ghi web hoặc chuyển sang IP nội bộ',
    });
  }

  // Grade calculation
  let grade: SecurityAuditResult['grade'] = 'F';
  if (score >= 95) grade = 'A+';
  else if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 50) grade = 'C';
  else if (score >= 30) grade = 'D';
  else grade = 'F';

  return {
    score,
    grade,
    zone_id: zone.id,
    zone_name: zone.name,
    scanned_at: new Date().toISOString(),
    checks,
  };
}
