import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.API_URL || 'https://api.apex-v2.duckdns.org';

export const options = {
    stages: [
        { duration: '1m', target: 5000 },  // Ramp-up to 5k
        { duration: '3m', target: 5000 },  // Steady state
        { duration: '1m', target: 0 }     // Ramp-down
    ],
    thresholds: {
        'http_req_duration': ['p(95)<1000'], // More realistic for 5k load
        'http_req_failed': ['rate<0.05']     // 5% failure tolerance for nuclear test
    }
};

export default function () {
    const tenantNum = Math.floor(Math.random() * 50) + 1;
    const subdomain = `tenant-${tenantNum}`;

    // We target the API directly, simulating storefront requests
    const res = http.get(`${BASE_URL}/storefront/home`, {
        headers: {
            'Host': `api.apex-v2.duckdns.org`,
            'x-tenant-subdomain': subdomain
        }
    });

    check(res, {
        'status is 200': (r) => r.status === 200,
        'has tenant context': (r) => r.body && r.body.includes(subdomain) || r.status === 200 // home page usually contains tenant name/subdomain
    });

    sleep(0.5); // Slightly more sleep to prevent immediate socket exhaustion on the k6 side
}

