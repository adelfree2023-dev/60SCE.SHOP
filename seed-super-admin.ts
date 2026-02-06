import * as crypto from 'crypto';

const password = 'ApexAdmin2024!';
const salt = crypto.randomBytes(16).toString('hex');
crypto.scrypt(password, salt, 64, (err, derivedKey) => {
    if (err) throw err;
    const hash = salt + ':' + derivedKey.toString('hex');
    console.log('HASH:' + hash);
});
