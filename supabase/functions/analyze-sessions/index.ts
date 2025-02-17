// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  try {
    console.log('Starting analysis...');
    
    // Validate environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch sessions with their blocks
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        blocks (*)
      `);

    if (sessionError) {
      console.error('Error fetching sessions:', sessionError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch sessions',
          details: sessionError 
        }),
        { 
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    if (!sessions || sessions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No sessions to analyze' 
        }),
        { 
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    console.log(`Processing ${sessions.length} sessions...`);

    // Group sessions by candidate
    const candidateData = sessions.reduce((acc: { [key: string]: any[] }, session: any) => {
      if (!acc[session.candidate_name]) {
        acc[session.candidate_name] = [];
      }
      acc[session.candidate_name].push(session);
      return acc;
    }, {});

    // Process each candidate's data
    for (const [candidateName, candidateSessions] of Object.entries(candidateData)) {
      const totalSessions = candidateSessions.length;
      let totalCompletedBlocks = 0;
      let totalExpectedBlocks = 0;
      
      candidateSessions.forEach((session: any) => {
        const blocks = session.blocks || [];
        const completedBlocks = blocks.filter((block: any) => 
          block.start_time && block.end_time
        ).length;
        totalCompletedBlocks += completedBlocks;
        totalExpectedBlocks += 7; // Each session should have 7 blocks
      });

      const completionRate = totalExpectedBlocks > 0 
        ? (totalCompletedBlocks / totalExpectedBlocks) * 100 
        : 0;

      const analysis = `Performance Analysis for ${candidateName}:
Sessions completed: ${totalSessions}/14
Completion rate: ${completionRate.toFixed(1)}%
Total completed blocks: ${totalCompletedBlocks}/${totalExpectedBlocks}
Status: ${totalSessions >= 12 ? "Qualified" : "In Progress"}`;

      // Store analysis in the session_analysis table
      const { error: insertError } = await supabase
        .from('session_analysis')
        .upsert(
          {
            candidate_name: candidateName,
            analysis,
            created_at: new Date().toISOString(),
          },
          {
            onConflict: 'candidate_name',
            ignoreDuplicates: false
          }
        );

      if (insertError) {
        console.error(`Error inserting analysis for ${candidateName}:`, insertError);
        return new Response(
          JSON.stringify({
            error: 'Failed to save analysis',
            details: insertError
          }),
          { 
            status: 500,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Analysis completed successfully' 
      }),
      { 
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-sessions:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
