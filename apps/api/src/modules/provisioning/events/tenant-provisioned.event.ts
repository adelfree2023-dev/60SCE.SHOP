export class TenantProvisionedEvent {
    constructor(public readonly payload: {
        subdomain: string;
        ownerEmail: string;
        blueprintId: string;
        schemaName: string;
        duration: number;
        phases: {
            schema: number;
            seed: number;
            route: number;
            register: number;
        };
    }) { }
}
