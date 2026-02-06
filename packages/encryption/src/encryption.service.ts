import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, createHmac } from 'crypto';
import * as argon2 from 'argon2';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

@Injectable()
export class EncryptionService implements OnModuleInit {
    private readonly logger = new Logger(EncryptionService.name);
    private masterSecret!: string;

    onModuleInit() {
        const secret = process.env.ENCRYPTION_KEY;
        if (!secret || secret.length < 32) {
            this.logger.error('❌ FATAL: ENCRYPTION_KEY for pii isolation is unsafe or missing.');
            // [SEC] S1/S7: Strict failure protocol. App MUST NOT start without a dedicated secret.
            process.exit(1);
        }
        this.masterSecret = secret;
        this.logger.log('✅ EncryptionService initialized with secure dedicated key');
    }

    /**
     * Derive encryption key using Argon2id with random salt
     * [SEC] S7: Uses random salt per operation (NOT static)
     */
    private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
        const hash = await argon2.hash(password, {
            type: argon2.argon2id,
            salt: salt,
            raw: true,
            memoryCost: 65536,
            timeCost: 3,
            parallelism: 4
        });
        return hash.slice(0, 32);
    }

    /**
     * Encrypt plaintext with random salt per operation
     * Output format: salt:iv:tag:ciphertext (all hex encoded)
     * [SEC] S7: Random salt ensures unique keys per encryption
     */
    async encrypt(plaintext: string): Promise<string> {
        if (plaintext === undefined || plaintext === null) {
            this.logger.error('Attempted to encrypt undefined/null value - verifying input safety');
            return ''; // Return empty string for safe handling, or throw if strict
        }
        if (typeof plaintext !== 'string') {
            this.logger.error(`Encryption input invalid type: ${typeof plaintext}`);
            throw new Error('Encryption failed: Input must be a string');
        }
        try {
            const salt = randomBytes(SALT_LENGTH);
            const key = await this.deriveKey(this.masterSecret, salt);
            const iv = randomBytes(IV_LENGTH);
            const cipher = createCipheriv(ALGORITHM, key, iv);
            const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
            const authTag = cipher.getAuthTag();

            // [SEC] S7: Store salt with ciphertext for decryption
            return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
        } catch (error: any) {
            this.logger.error(`Encryption failed: ${error.message}`);
            throw new Error('Encryption failed');
        }
    }

    /**
     * Decrypt ciphertext using stored salt
     * Input format: salt:iv:tag:ciphertext (all hex encoded)
     */
    async decrypt(ciphertextWithSalt: string): Promise<string> {
        if (!ciphertextWithSalt) return '';
        try {
            const parts = ciphertextWithSalt.split(':');
            if (parts.length !== 4) {
                throw new Error('Invalid encrypted payload format (expected salt:iv:tag:ciphertext)');
            }
            const [saltHex, ivHex, authTagHex, ciphertextHex] = parts;

            const salt = Buffer.from(saltHex, 'hex');
            const key = await this.deriveKey(this.masterSecret, salt);
            const iv = Buffer.from(ivHex, 'hex');
            const authTag = Buffer.from(authTagHex, 'hex');
            const ciphertext = Buffer.from(ciphertextHex, 'hex');

            const decipher = createDecipheriv(ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);

            return decipher.update(ciphertext) + decipher.final('utf8');
        } catch (error: any) {
            this.logger.error(`Decryption failed: ${error.message}`);
            throw new Error('Decryption failed');
        }
    }

    async encryptDbValue(value: string): Promise<string> {
        if (!value) return value;
        return 'enc:' + (await this.encrypt(value));
    }

    async decryptDbValue(encryptedValue: string): Promise<string> {
        if (!encryptedValue || !encryptedValue.startsWith('enc:')) {
            return encryptedValue;
        }
        return this.decrypt(encryptedValue.slice(4));
    }
}
