'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useVault, VaultDocument } from '@/hooks/use-vault';
import {
    Lock,
    Upload,
    FileText,
    Download,
    Loader2,
    ShieldCheck,
    AlertTriangle,
    Eye,
    Key
} from 'lucide-react';
import { format } from 'date-fns';

interface Props {
    familyId: string;
}

export default function VaultExplorer({ familyId }: Props) {
    const supabase = createClient();
    const { uploadToVault, downloadFromVault } = useVault();

    const [documents, setDocuments] = useState<VaultDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [decrypting, setDecrypting] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState<'upload' | 'download' | null>(null);
    const [password, setPassword] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedDoc, setSelectedDoc] = useState<VaultDocument | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchDocuments();

        // Subscribe to realtime updates
        const channel = supabase
            .channel(`vault-${familyId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'vault_documents', filter: `family_id=eq.${familyId}` },
                () => fetchDocuments()
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [familyId]);

    const fetchDocuments = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('vault_documents')
            .select('*')
            .eq('family_id', familyId)
            .order('created_at', { ascending: false });

        if (data) setDocuments(data as VaultDocument[]);
        setLoading(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setShowPasswordModal('upload');
            setPassword('');
            setError(null);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !password) return;

        setUploading(true);
        setError(null);

        try {
            await uploadToVault(selectedFile, password, familyId);
            setShowPasswordModal(null);
            setPassword('');
            setSelectedFile(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const initiateDownload = (doc: VaultDocument) => {
        setSelectedDoc(doc);
        setShowPasswordModal('download');
        setPassword('');
        setError(null);
    };

    const handleDownload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoc || !password) return;

        setDecrypting(selectedDoc.id);
        setError(null);

        try {
            const url = await downloadFromVault(selectedDoc, password);

            // Trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = selectedDoc.file_name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setShowPasswordModal(null);
            setPassword('');
            setSelectedDoc(null);
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Decryption failed");
        } finally {
            setDecrypting(null);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--clay-900)]">
                        <ShieldCheck className="w-6 h-6 text-emerald-600" />
                        The Vault
                    </h2>
                    <p className="text-sm text-[var(--clay-500)] max-w-lg mt-1">
                        Zero-knowledge encrypted storage. Files are encrypted on your device before upload.
                        Only you hold the keys.
                    </p>
                </div>
                <div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--sage-600)] text-white rounded-xl hover:bg-[var(--sage-700)] transition-shadow shadow-sm hover:shadow-md font-medium"
                    >
                        <Upload className="w-4 h-4" />
                        Upload Secure File
                    </button>
                    <input
                        title="Upload Secure File"
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                </div>
            </div>

            {/* File List */}
            <div className="bg-white dark:bg-[var(--clay-100)] rounded-xl border border-[var(--clay-200)] shadow-sm overflow-hidden min-h-[300px]">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="w-8 h-8 animate-spin text-[var(--clay-300)]" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-[var(--clay-400)] gap-3 bg-[var(--clay-50)]/50">
                        <div className="w-16 h-16 rounded-full bg-[var(--clay-100)] flex items-center justify-center">
                            <Lock className="w-8 h-8 text-[var(--clay-300)]" />
                        </div>
                        <p className="font-medium">Vault is empty</p>
                        <p className="text-sm text-center max-w-xs">
                            Upload documents like insurance cards, living wills, or prescriptions.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--clay-50)] border-b border-[var(--clay-200)]">
                                <tr>
                                    <th className="py-3 px-4 font-medium text-[var(--clay-600)]">Name</th>
                                    <th className="py-3 px-4 font-medium text-[var(--clay-600)] w-32">Size</th>
                                    <th className="py-3 px-4 font-medium text-[var(--clay-600)] w-40">Uploaded</th>
                                    <th className="py-3 px-4 font-medium text-[var(--clay-600)] w-24 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--clay-100)]">
                                {documents.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-[var(--clay-50)] dark:hover:bg-[var(--clay-200)] transition-colors group">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[var(--sage-100)] text-[var(--sage-700)] flex items-center justify-center shrink-0">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[var(--clay-900)] truncate max-w-[200px] md:max-w-sm">
                                                        {doc.file_name}
                                                    </p>
                                                    <p className="text-xs text-[var(--clay-500)] font-mono truncate max-w-[200px]">
                                                        ID: {doc.id.slice(0, 8)}...
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-[var(--clay-600)]">
                                            {formatFileSize(doc.file_size)}
                                        </td>
                                        <td className="py-3 px-4 text-[var(--clay-600)]">
                                            {format(new Date(doc.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <button
                                                onClick={() => initiateDownload(doc)}
                                                className="p-2 text-[var(--clay-400)] hover:text-[var(--sage-600)] hover:bg-[var(--sage-50)] rounded-lg transition-colors"
                                                title="Decrypt & Download"
                                            >
                                                {decrypting === doc.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Password Modal (Shared for Upload & Download) */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[var(--clay-100)] rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-[var(--sage-100)] text-[var(--sage-600)] flex items-center justify-center">
                                <Key className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[var(--clay-900)]">
                                    {showPasswordModal === 'upload' ? 'Encrypt & Upload' : 'Decrypt & Download'}
                                </h3>
                                <p className="text-xs text-[var(--clay-500)]">
                                    Enter your encryption password.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={showPasswordModal === 'upload' ? handleUpload : handleDownload}>
                            <div className="space-y-4">
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-start gap-2 border border-red-200">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {showPasswordModal === 'upload' && selectedFile && (
                                    <div className="p-3 bg-[var(--clay-50)] rounded-lg border border-[var(--clay-200)] flex items-center gap-2 text-sm">
                                        <FileText className="w-4 h-4 text-[var(--clay-500)]" />
                                        <span className="font-medium truncate">{selectedFile.name}</span>
                                        <span className="text-[var(--clay-400)] text-xs ml-auto">
                                            {formatFileSize(selectedFile.size)}
                                        </span>
                                    </div>
                                )}

                                {showPasswordModal === 'download' && selectedDoc && (
                                    <div className="p-3 bg-[var(--clay-50)] rounded-lg border border-[var(--clay-200)] flex items-center gap-2 text-sm">
                                        <Lock className="w-4 h-4 text-[var(--clay-500)]" />
                                        <span className="font-medium truncate">{selectedDoc.file_name}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-[var(--clay-700)] mb-1">
                                        Encryption Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-[var(--clay-300)] rounded-xl bg-white dark:bg-[var(--clay-50)] focus:ring-2 focus:ring-[var(--sage-400)] focus:border-transparent outline-none transition-all"
                                            placeholder="Enter password..."
                                            autoFocus
                                            required
                                        />
                                        <Lock className="w-4 h-4 text-[var(--clay-400)] absolute left-3 top-2.5" />
                                    </div>
                                    <p className="text-[10px] text-[var(--clay-500)] mt-1.5 leading-relaxed">
                                        <strong className="text-amber-600">Warning:</strong> If you lose this password, this file cannot be recovered. We do not store your password.
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPasswordModal(null);
                                            setPassword('');
                                            setError(null);
                                            setSelectedFile(null);
                                            setSelectedDoc(null);
                                        }}
                                        className="flex-1 py-2.5 border border-[var(--clay-300)] text-[var(--clay-600)] font-medium rounded-xl hover:bg-[var(--clay-50)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!password || uploading || !!decrypting}
                                        className="flex-1 py-2.5 bg-[var(--sage-600)] text-white font-medium rounded-xl hover:bg-[var(--sage-700)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {uploading || decrypting ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : showPasswordModal === 'upload' ? (
                                            <>
                                                <Lock className="w-4 h-4" /> Encrypt & Upload
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-4 h-4" /> Decrypt & View
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
