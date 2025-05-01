// @ts-ignore Deno URL import is valid at runtime
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
// @ts-ignore Local relative import
import { updateHoleStatsFromMetrix } from './metrixService.ts';
serve(async ()=>{
    const start = Date.now();
    const result = await updateHoleStatsFromMetrix(Deno.env.toObject());
    const duration = Date.now() - start;
    console.log(`[Edge Function] Done in ${duration}ms`, result);
    return new Response(JSON.stringify(result), {
        headers: {
            "Content-Type": "application/json"
        }
    });
});
