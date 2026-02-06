export class TenantFailedEvent {
    constructor(public readonly payload: {
        subdomain: string;
        error: string;
        duration: number;
    }) { }
}
