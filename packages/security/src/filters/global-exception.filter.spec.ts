import { HttpException, HttpStatus } from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';

describe('GlobalExceptionFilter (S5)', () => {
    const filter = new GlobalExceptionFilter();

    const getMockHost = (mockResponse: any) => ({
        switchToHttp: jest.fn(() => ({
            getResponse: jest.fn(() => mockResponse),
            getRequest: jest.fn(() => ({ url: '/test' })),
        })),
    } as any);

    it('should format HttpException correctly', () => {
        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
        const host = getMockHost(mockResponse);
        const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

        filter.catch(exception, host);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
    });

    it('should handle generic errors as 500', () => {
        const mockResponse = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
        const host = getMockHost(mockResponse);
        const exception = new Error('Generic error');

        filter.catch(exception, host);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
});
