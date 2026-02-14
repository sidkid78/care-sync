import VaultExplorer from '@/components/vault/VaultExplorer';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function VaultPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect('/login');
    }

    // Fetch the user's family
    const { data: familyMember } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('profile_id', user.id)
        .single();

    if (!familyMember) {
        return (
            <div className="p-8 text-center bg-[var(--sage-50)] rounded-2xl border border-[var(--sage-200)] m-6">
                <h2 className="text-lg font-semibold text-[var(--sage-800)] mb-2">No Family Found</h2>
                <p className="text-[var(--clay-600)]">You must be part of a family to use the Vault.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <VaultExplorer familyId={familyMember.family_id} />
        </div>
    );
}
