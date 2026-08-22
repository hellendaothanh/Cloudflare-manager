'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { 
  BookOpen, 
  X, 
  Search, 
  ExternalLink, 
  ShieldCheck, 
  Globe, 
  Lock, 
  SlidersHorizontal, 
  Server, 
  Activity, 
  Cpu, 
  Sparkles, 
  HelpCircle,
  Code2,
  FileCheck,
  Flame,
  KeyRound,
  Radio,
  FileJson
} from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  if (!isOpen) return null;

  const docs = language === 'vi' ? [
    {
      id: 'dns',
      category: 'connectivity',
      title: 'Quản trị DNS & Proxy CDN',
      icon: Globe,
      summary: 'Quản lý toàn diện bản ghi A, AAAA, CNAME, TXT, MX, CAA và chế độ Proxy CDN của Cloudflare.',
      details: [
        'Bật đám mây cam (Proxied): Mọi truy vấn sẽ được định tuyến qua mạng Anycast của Cloudflare, ẩn IP máy chủ gốc, lọc DDoS và cache tài nguyên.',
        'Tắt đám mây (DNS Only): Truy vấn DNS phân giải trực tiếp về máy chủ gốc, không đi qua lớp bảo vệ của Cloudflare.',
        'Xuất file BIND Zone: Hỗ trợ backup hoặc import sang các hệ thống DNS khác (BIND 9, PowerDNS, Route 53).',
      ],
      bestPractice: 'Luôn bật Proxy cho các web endpoint (Apex, www, api) và chỉ dùng DNS Only cho Mail (MX) hoặc VPN.',
    },
    {
      id: 'origin_lb',
      category: 'connectivity',
      title: 'Load Balancing, Geo-Steering & Máy chủ Gốc',
      icon: Server,
      summary: 'Cân bằng tải Anycast Native, điều phối traffic theo địa lý (Geo-Steering) và bảo vệ máy chủ gốc.',
      details: [
        'Traffic Steering: Định tuyến người dùng theo RTT thấp nhất (Dynamic), vị trí địa lý (Geo-Steering) hoặc tỷ lệ % trọng số (Weight).',
        'Session Affinity: Giữ phiên đăng nhập/giỏ hàng cố định vào cùng một server qua HTTP Cookie (cf-affinity).',
        'Origin Shield (X-Origin-Verify-Secret): Đặt secret header để máy chủ Nginx/Apache chặn thẳng HTTP 403 đối với các lượt truy cập trực tiếp bằng IP.',
      ],
      bestPractice: 'Kích hoạt Origin Shield trên Nginx/Apache để triệt tiêu hoàn toàn nguy cơ bị bypass qua WAF.',
    },
    {
      id: 'waf_security',
      category: 'security',
      title: 'WAF Firewall & Quy tắc Bảo mật',
      icon: ShieldCheck,
      summary: 'Tường lửa ứng dụng web lọc bỏ các cuộc tấn công SQL Injection, XSS và botnet nguy hại.',
      details: [
        'Wirefilter Expression: Cú pháp biểu thức linh hoạt dựa trên IP, quốc gia (ip.geoip.country), URI, Header và Threat Score.',
        'Chế độ Hành động: Block (chặn thẳng), Managed Challenge (thách thức thông minh), JS Challenge, Allow (cho phép).',
        'IP Access Rules: Whitelist hoặc Blacklist nhanh chóng theo IP đơn, dải CIDR, mã quốc gia hoặc số hiệu ASN.',
      ],
      bestPractice: 'Sử dụng Managed Challenge thay vì Block tuyệt đối với các traffic nghi vấn để tránh chặn nhầm người dùng thật.',
    },
    {
      id: 'api_shield',
      category: 'security',
      title: 'API Shield & Mutual TLS (mTLS)',
      icon: KeyRound,
      summary: 'Bảo mật API chuyên sâu cho Microservices & B2B bằng xác thực Client Certificate x509 song phương và kiểm định Schema.',
      details: [
        'Mutual TLS (mTLS): Bắt buộc client phải xuất trình chứng chỉ số x509 hợp lệ mới được gửi request tới API.',
        'OpenAPI/Swagger Validation: Tự động chặn các request có payload JSON sai format hoặc thiếu required fields ngay tại Edge.',
        'Positive Security Model: Chỉ chấp nhận các request tuân thủ 100% schema đã khai báo.',
      ],
      bestPractice: 'Áp dụng mTLS cho các kênh thanh toán liên ngân hàng và OpenAPI validation cho các endpoint nhạy cảm.',
    },
    {
      id: 'rulesets',
      category: 'connectivity',
      title: 'Modern Ruleset Engine & Transform Rules',
      icon: SlidersHorizontal,
      summary: 'Thay thế Page Rules truyền thống bằng hệ thống Ruleset thế hệ mới chạy song song.',
      details: [
        'Dynamic Redirects: Chuyển hướng 301/302/307/308 kèm tùy chọn bảo lưu tham số query string.',
        'HTTP Headers: Tự động chèn các tiêu chuẩn bảo mật Content-Security-Policy, HSTS, X-Frame-Options: DENY tại Edge.',
        'URL Rewrites & Query Sanitizer: Viết lại đường dẫn động và lọc bỏ các tham số rác (fbclid, gclid, utm_*).',
      ],
      bestPractice: 'Sử dụng Transform Rules để thêm Security Headers cho toàn bộ trang web mà không cần sửa code backend.',
    },
    {
      id: 'ssl',
      category: 'security',
      title: 'Mã hóa SSL/TLS & Quét Hạn Chứng chỉ Gốc',
      icon: Lock,
      summary: 'Quản trị mã hóa đầu cuối và cảnh báo sớm trước khi chứng chỉ SSL của máy chủ gốc hết hạn.',
      details: [
        'SSL Mode Full (Strict): Mã hóa tuyệt đối từ Trình duyệt -> Cloudflare -> Origin Server, bắt buộc chứng chỉ gốc phải hợp lệ.',
        'Origin SSL Scanner: Tự động quét TLS Handshake định kỳ và cảnh báo qua Telegram/Slack trước 30/15/7 ngày để chống Error 526.',
        'Origin CA 15 năm: Sử dụng chứng chỉ chuyên dụng miễn phí từ Cloudflare với thời hạn 15 năm.',
      ],
      bestPractice: 'Luôn cài đặt chứng chỉ Cloudflare Origin CA và bật chế độ Full (Strict) cùng Minimum TLS 1.2+.',
    },
    {
      id: 'finops',
      category: 'governance',
      title: 'Cost & FinOps Hub (Tối ưu Chi phí Egress)',
      icon: Activity,
      summary: 'Đo lường tỷ lệ Cache Hit Ratio, tối ưu băng thông kéo từ máy chủ gốc và kiểm soát chi phí Workers/R2.',
      details: [
        'Egress Savings: Thống kê số tiền tiết kiệm được từ băng thông không phải tải trực tiếp từ Origin AWS/GCP.',
        '1-Click Optimization: Bật Tiered Cache, tối ưu TTL và kích hoạt nén Brotli + Early Hints (HTTP 103).',
        'Workers & R2 Insights: Giám sát thời gian thực thi CPU Wall-time và dung lượng R2 không mất phí tải ($0 Egress).',
      ],
      bestPractice: 'Kích hoạt Tiered Cache để đẩy tỷ lệ Cache Hit lên trên 85%, giúp giảm hơn 70% chi phí egress máy chủ gốc.',
    },
    {
      id: 'gitops',
      category: 'governance',
      title: 'CI/CD Compliance, GitOps & Break-Glass',
      icon: Code2,
      summary: 'Đồng bộ 2 chiều với Git (Terraform HCL), quét sai lệch cấu hình tự động (Drift) và chế độ cứu hộ khẩn cấp.',
      details: [
        'Two-Way GitOps: Tự động commit các thay đổi về GitHub/GitLab dưới dạng Terraform code (main.tf).',
        'Emergency Break-Glass: 1-Click chuyển toàn bộ traffic sang trang bảo trì tĩnh trên Edge khi Origin gặp sự cố thảm họa.',
        'Scheduled Drift Scanner: Tự động quét ngầm theo lịch CRON và bắn cảnh báo khi có thay đổi trái phép.',
      ],
      bestPractice: 'Luôn xuất bản bản sao lưu Snapshot trước các kỳ Release lớn để có thể 1-Click Rollback tức thì.',
    },
  ] : [
    {
      id: 'dns',
      category: 'connectivity',
      title: 'DNS Management & CDN Edge Proxy',
      icon: Globe,
      summary: 'Complete CRUD operations for A, AAAA, CNAME, TXT, MX, CAA records with Cloudflare Proxy routing.',
      details: [
        'Orange Cloud (Proxied): Requests route through Cloudflare Anycast, masking Origin IP, absorbing DDoS, and caching assets.',
        'Grey Cloud (DNS Only): Requests resolve directly to origin server without Cloudflare security or CDN caching.',
        'BIND Export: Export RFC-compliant zone configuration for backup and multi-DNS migrations.',
      ],
      bestPractice: 'Always enable Proxy for web endpoints (Apex, www, api) and use DNS Only for Mail (MX) or VPNs.',
    },
    {
      id: 'origin_lb',
      category: 'connectivity',
      title: 'Load Balancing, Geo-Steering & Origin Hub',
      icon: Server,
      summary: 'Native Anycast Load Balancing, Geo-Steering regional matrix, and Origin Shield protection.',
      details: [
        'Traffic Steering: Route visitors based on lowest latency (Dynamic), geographic continent/country (Geo-Steering), or weights.',
        'Session Affinity: Maintain sticky visitor sessions to the same backend node via HTTP Cookie (cf-affinity).',
        'Origin Shield (X-Origin-Verify-Secret): Shared secret header allowing Nginx/Apache to drop unauthorized direct IP hits (HTTP 403).',
      ],
      bestPractice: 'Deploy Origin Shield on backend web servers to completely eliminate origin IP bypass vulnerabilities.',
    },
    {
      id: 'waf_security',
      category: 'security',
      title: 'WAF Firewall & Security Rules',
      icon: ShieldCheck,
      summary: 'Application-layer firewall filtering SQL Injection, Cross-Site Scripting (XSS), and malicious botnets.',
      details: [
        'Wirefilter Expressions: Wireshark-standard syntax based on IP, country (ip.geoip.country), URI paths, headers, and threat scores.',
        'Execution Actions: Block, Managed Challenge, JS Challenge, and Allow.',
        'IP Access Rules: Whitelist and Blacklist IPs, CIDR subnets, country codes, or ASNs.',
      ],
      bestPractice: 'Use Managed Challenge instead of immediate Block for suspicious traffic to prevent false positives.',
    },
    {
      id: 'api_shield',
      category: 'security',
      title: 'API Shield & Mutual TLS (mTLS)',
      icon: KeyRound,
      summary: 'Enterprise API security with bidirectional x509 Client Certificate authentication and OpenAPI schema validation.',
      details: [
        'Mutual TLS (mTLS): Mandate valid client certificates before processing API requests (ideal for B2B & microservices).',
        'OpenAPI/Swagger Validation: Automatically drop malformed JSON payloads and invalid parameters at the Edge (HTTP 400).',
        'Positive Security Model: Enforce strict contract validation against uploaded OpenAPI 3.0/3.1 specs.',
      ],
      bestPractice: 'Enforce mTLS for payment gateways and OpenAPI schema validation on all state-changing endpoints (POST/PUT).',
    },
    {
      id: 'rulesets',
      category: 'connectivity',
      title: 'Modern Ruleset Engine & Transform Rules',
      icon: SlidersHorizontal,
      summary: 'Deprecate legacy Page Rules with next-generation Ruleset Engine featuring unlimited parallel execution.',
      details: [
        'Dynamic Redirects: HTTP 301/302/307/308 redirects with full query string preservation.',
        'HTTP Headers: Inject Content-Security-Policy, HSTS, and X-Frame-Options: DENY directly at the Edge.',
        'URL Rewrites & Sanitizer: Rewrite dynamic routes and strip tracking parameters (fbclid, gclid, utm_*).',
      ],
      bestPractice: 'Use Transform Rules to enforce security response headers globally without backend application modifications.',
    },
    {
      id: 'ssl',
      category: 'security',
      title: 'SSL/TLS Encryption & Origin Expiry Scanner',
      icon: Lock,
      summary: 'End-to-end encryption management and proactive origin certificate expiration monitoring.',
      details: [
        'SSL Mode Full (Strict): End-to-end encryption requiring trusted, valid certificates on origin servers.',
        'Origin SSL Scanner: Automated TLS probing with 30/15/7-day Telegram/Slack alerts to eliminate Error 526 outages.',
        '15-Year Origin CA: Free dedicated certificates issued by Cloudflare valid for up to 15 years.',
      ],
      bestPractice: 'Install Cloudflare Origin CA certificates and enforce Full (Strict) SSL with Minimum TLS 1.2+.',
    },
    {
      id: 'finops',
      category: 'governance',
      title: 'Cost & FinOps Hub (Egress Optimization)',
      icon: Activity,
      summary: 'Real-time cache hit ratio measurement, origin egress bandwidth savings, and Workers/R2 cost analytics.',
      details: [
        'Egress Savings: Calculate exact dollar savings from cached bandwidth offloaded from AWS/GCP origins.',
        '1-Click Optimization: Enable Tiered Cache, optimize asset TTL, and activate Brotli + Early Hints (HTTP 103).',
        'Workers & R2 Insights: Monitor CPU Wall-time execution latency and $0 egress object storage metrics.',
      ],
      bestPractice: 'Activate Tiered Cache to boost cache hit ratio above 85%, cutting origin egress bills by up to 70%.',
    },
    {
      id: 'gitops',
      category: 'governance',
      title: 'CI/CD Compliance, GitOps & Break-Glass',
      icon: Code2,
      summary: 'Two-way Git sync with Terraform HCL, scheduled drift detection, and emergency disaster recovery.',
      details: [
        'Two-Way GitOps: Automatically commit live configurations to GitHub/GitLab as Terraform HCL (main.tf).',
        'Emergency Break-Glass: 1-Click traffic divert to static Edge maintenance pages during origin disasters.',
        'Scheduled Drift Scanner: Automated CRON background checks alerting on unauthorized configuration drift.',
      ],
      bestPractice: 'Export JSON baseline snapshots prior to major software releases for instant 1-click disaster rollback.',
    },
  ];

  const filteredDocs = docs.filter((d) => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.details.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = activeCategory === 'all' || d.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <BookOpen className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {language === 'vi' ? 'Sổ Tay Hướng Dẫn & Cẩm Nang DevSecOps' : 'Interactive DevSecOps Knowledge & Guide'}
              </h2>
              <p className="text-xs text-gray-400">
                {language === 'vi' 
                  ? 'Giải thích chi tiết nguyên lý hoạt động và khuyến nghị cấu hình chuẩn cho từng phân hệ.' 
                  : 'In-depth architecture explanations and best-practice recommendations for every module.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Search */}
        <div className="p-4 border-b border-gray-800 bg-gray-950/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {language === 'vi' ? 'Tất cả' : 'All Modules'}
            </button>
            <button
              onClick={() => setActiveCategory('connectivity')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === 'connectivity'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {language === 'vi' ? 'Hạ tầng & Định tuyến' : 'Connectivity & Routing'}
            </button>
            <button
              onClick={() => setActiveCategory('security')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === 'security'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {language === 'vi' ? 'Lá chắn Bảo mật' : 'Security Shield'}
            </button>
            <button
              onClick={() => setActiveCategory('governance')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeCategory === 'governance'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {language === 'vi' ? 'Giám sát & FinOps' : 'FinOps & Governance'}
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm kiếm hướng dẫn...' : 'Search guide & features...'}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDocs.map((doc) => {
              const Icon = doc.icon;
              return (
                <div key={doc.id} className="p-5 rounded-2xl bg-gray-950 border border-gray-850 hover:border-gray-750 transition-all flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="p-2 rounded-xl bg-gray-900 text-cyan-400 border border-gray-800">
                        <Icon className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-bold text-white">{doc.title}</h3>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed mb-3">
                      {doc.summary}
                    </p>

                    <div className="space-y-1.5 text-[11px] text-gray-400">
                      {doc.details.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-1.5">
                          <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200/90 leading-relaxed">
                    <strong className="text-cyan-300 block mb-0.5">
                      {language === 'vi' ? 'Khuyến nghị Thực hành Tốt nhất:' : 'DevSecOps Best Practice:'}
                    </strong>
                    {doc.bestPractice}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-950 border-t border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <span>
            {language === 'vi' ? 'Mẹo: Rà chuột vào biểu tượng dấu chấm hỏi (?) trên từng phân hệ để xem giải thích nhanh.' : 'Tip: Hover over (?) icons on each module for quick contextual explanations.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors"
          >
            {language === 'vi' ? 'Đã hiểu' : 'Got it'}
          </button>
        </div>

      </div>
    </div>
  );
};
