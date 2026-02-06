import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 100,
    duration: '3m',
    thresholds: {
        'http_req_failed': ['rate<0.5'] // Allow higher failure for chaos
    }
};

export default function () {
    const res = http.get(`https://api.apex-v2.duckdns.org/health`, {
        headers: { 'Host': `tenant-1.apex-v2.duckdns.org` }
    });
    check(res, { 'status is 200': (r) => r.status === 200 });
    sleep(0.1);
}
