import { createClient } from 'https://esm.sh/@supabase/supabase-js';
export const updateHoleStatsFromMetrix = async (env)=>{
    const totalStart = Date.now();
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
    const url = 'https://discgolfmetrix.com/api.php?content=result&id=2834664';
    const fetchStart = Date.now();
    const res = await fetch(url);
    const data = await res.json();
    const fetchDuration = Date.now() - fetchStart;
    console.log(`[Metrix] Fetch duration: ${fetchDuration}ms`);
    const parseStart = Date.now();
    const holeStats = {};
    const comp = data?.Competition;
    if (comp) {
        const players = comp.Results || [];
        for (const player of players){
            const holes = player?.PlayerResults || [];
            for(let i = 0; i < holes.length; i++){
                const holeIndex = i + 1;
                const diff = holes[i]?.Diff;
                if (!holeStats[holeIndex]) {
                    holeStats[holeIndex] = {
                        eagles: 0,
                        birdies: 0,
                        pars: 0,
                        bogeys: 0,
                        double_bogeys: 0,
                        others: 0
                    };
                }
                if (diff <= -2) holeStats[holeIndex].eagles++;
                else if (diff === -1) holeStats[holeIndex].birdies++;
                else if (diff === 0) holeStats[holeIndex].pars++;
                else if (diff === 1) holeStats[holeIndex].bogeys++;
                else if (diff === 2) holeStats[holeIndex].double_bogeys++;
                else if (diff >= 3) holeStats[holeIndex].others++;
            }
        }
    }
    const parseDuration = Date.now() - parseStart;
    console.log(`[Metrix] Parse & calculation duration: ${parseDuration}ms`);
    const updateStart = Date.now();
    const updates = Object.entries(holeStats).map(([holeNumber, stats])=>({
        number: Number(holeNumber),
        ...stats
    }));
    const { error } = await supabase.from('hole').upsert(updates, {
        onConflict: 'number'
    });
    const updateDuration = Date.now() - updateStart;
    const totalDuration = Date.now() - totalStart;
    console.log(`[Metrix] Update duration: ${updateDuration}ms`);
    console.log(`[Metrix] Total duration: ${totalDuration}ms`);
    return {
        success: !error,
        updated: updates.length,
        error
    };
};
