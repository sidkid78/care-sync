import { createClient } from '@/utils/supabase/client';
import { encryptFile, decryptFile } from '@/lib/crypto';

export interface VaultDocument {
    id: string;
    file_name: string;
    storage_path: string;
    mime_type: string;
    file_size: number;
    encryption_iv: string;
    encryption_salt: string;
    checksum: string;
    created_at: string;
}

export function useVault() {
    const supabase = createClient();

    const uploadToVault = async (file: File, password: string, familyId: string) => {
        // 1. Encrypt locally
        const { encryptedBlob, iv, salt, checksum } = await encryptFile(file, password);

        // 2. Upload Encrypted Blob to Supabase Storage
        const storagePath = `${familyId}/${crypto.randomUUID()}.enc`;
        const { error: storageError } = await supabase.storage
            .from('vault')
            .upload(storagePath, encryptedBlob);

        if (storageError) throw storageError;

        // 3. Store Metadata in PostgreSQL
        const { data: userData } = await supabase.auth.getUser();

        // We need to cast the insert to any or define the table types properly if not already defined
        const { error: dbError } = await supabase
            .from('vault_documents')
            .insert({
                family_id: familyId,
                uploaded_by: userData.user?.id,
                file_name: file.name,
                storage_path: storagePath,
                mime_type: file.type,
                file_size: file.size,
                encryption_iv: iv,
                encryption_salt: salt,
                checksum: checksum
            } as any);

        if (dbError) throw dbError;

        return { success: true };
    };

    const downloadFromVault = async (document: VaultDocument, password: string) => {
        // 1. Download encrypted blob
        const { data, error } = await supabase.storage
            .from('vault')
            .download(document.storage_path);

        if (error) throw error;
        if (!data) throw new Error("No data downloaded");

        const encryptedBuffer = await data.arrayBuffer();

        // 2. Verify Integrity (Checksum)
        const hashBuffer = await crypto.subtle.digest('SHA-256', encryptedBuffer);
        const currentChecksum = Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        if (currentChecksum !== document.checksum) {
            throw new Error("Integrity check failed: The file may have been tampered with.");
        }

        // 3. Decrypt locally
        try {
            const decryptedBuffer = await decryptFile(
                encryptedBuffer,
                password,
                document.encryption_iv,
                document.encryption_salt
            );

            // 4. Create local URL for user to view/download
            const blob = new Blob([decryptedBuffer], { type: document.mime_type });
            return URL.createObjectURL(blob);
        } catch (e) {
            console.error("Decryption failed", e);
            throw new Error("Decryption failed. Please check your password.");
        }
    };

    return { uploadToVault, downloadFromVault };
}
