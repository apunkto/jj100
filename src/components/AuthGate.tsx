import {ReactNode, useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import {supabase} from '@/src/lib/supabaseClient';
import {Box, CircularProgress} from '@mui/material';

type Props = {
    children: ReactNode;
    publicRoutes?: string[];
};

export default function AuthGate({
                                     children,
                                     publicRoutes = ['/login'],
                                 }: Props) {
    const router = useRouter();
    const [checking, setChecking] = useState(true);

    const isPublicRoute = publicRoutes.includes(router.pathname);

    useEffect(() => {
        let mounted = true;

        const run = async () => {
            if (isPublicRoute) {
                if (mounted) setChecking(false);
                return;
            }

            const { data } = await supabase.auth.getSession();
            const session = data.session;
            if (!mounted) return;

            if (!session) {
                // preserve where user wanted to go
                const next = encodeURIComponent(router.asPath);
                router.replace(`/login?next=${next}`);
                return;
            }

            setChecking(false);
        };

        run();

        const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
            // if user logs out, kick them to login (unless already on public route)
            if (!session && !publicRoutes.includes(router.pathname)) {
                const next = encodeURIComponent(router.asPath);
                router.replace(`/login?next=${next}`);
            }
        });

        return () => {
            mounted = false;
            sub.subscription.unsubscribe();
        };
    }, [router.pathname, router.asPath, isPublicRoute, publicRoutes, router]);

    if (checking) {
        return (
            <Box mt={6} display="flex" justifyContent="center">
                <CircularProgress />
            </Box>
        );
    }

    return <>{children}</>;
}
