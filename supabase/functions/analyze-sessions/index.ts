
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SessionAnalysis {
  sessionNumber: number;
  completedBlocks: number;
  totalBlocks: number;
  averageBlockDuration: number;
  notes: string;
}

interface CandidateMetrics {
  totalSessions: number;
  completionRate: number;
  averageBlocksPerSession: number;
  consistency: number;
  timeManagement: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Fetch session data
    const { data: sessions, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        blocks (*)
      `);

    if (sessionError) throw sessionError;

    // Process data by candidate
    const candidateData = sessions.reduce((acc: any, session: any) => {
      if (!acc[session.candidate_name]) {
        acc[session.candidate_name] = [];
      }
      acc[session.candidate_name].push(session);
      return acc;
    }, {});

    // Calculate metrics for all candidates
    const candidateMetrics: Record<string, CandidateMetrics> = {};
    let topPerformer = { name: '', metrics: null as CandidateMetrics | null };

    // First pass: Calculate basic metrics for each candidate
    for (const [candidate, sessions] of Object.entries(candidateData)) {
      const sessionAnalyses: SessionAnalysis[] = sessions.map((session: any) => {
        const completedBlocks = session.blocks.filter((block: any) => 
          block.start_time && block.end_time
        ).length;

        const blockDurations = session.blocks
          .filter((block: any) => block.start_time && block.end_time)
          .map((block: any) => {
            const start = new Date(`1970-01-01T${block.start_time}`);
            const end = new Date(`1970-01-01T${block.end_time}`);
            return (end.getTime() - start.getTime()) / 1000 / 60; // Duration in minutes
          });

        const averageBlockDuration = blockDurations.length > 0 
          ? blockDurations.reduce((a: number, b: number) => a + b, 0) / blockDurations.length 
          : 0;

        return {
          sessionNumber: session.session_number,
          completedBlocks,
          totalBlocks: session.blocks.length,
          averageBlockDuration,
          notes: session.blocks.map((block: any) => block.notes).filter(Boolean).join(' ')
        };
      });

      const totalCompletedBlocks = sessionAnalyses.reduce((sum, s) => sum + s.completedBlocks, 0);
      const totalBlocks = sessionAnalyses.reduce((sum, s) => sum + s.totalBlocks, 0);
      const completionRate = (totalCompletedBlocks / totalBlocks) * 100;
      
      // Calculate consistency score based on variation in completed blocks per session
      const blocksPerSession = sessionAnalyses.map(s => s.completedBlocks);
      const avgBlocks = blocksPerSession.reduce((a, b) => a + b, 0) / blocksPerSession.length;
      const variance = blocksPerSession.reduce((sum, blocks) => 
        sum + Math.pow(blocks - avgBlocks, 2), 0) / blocksPerSession.length;
      const consistency = Math.max(0, 100 - Math.sqrt(variance) * 10);

      // Calculate time management score
      const avgDuration = sessionAnalyses.reduce((sum, s) => sum + s.averageBlockDuration, 0) / sessionAnalyses.length;
      const timeManagement = Math.min(100, Math.max(0, 100 - Math.abs(45 - avgDuration))); // Assuming 45 minutes is ideal

      const metrics: CandidateMetrics = {
        totalSessions: sessions.length,
        completionRate,
        averageBlocksPerSession: totalCompletedBlocks / sessions.length,
        consistency,
        timeManagement
      };

      candidateMetrics[candidate] = metrics;

      // Update top performer
      if (!topPerformer.metrics || 
          (metrics.completionRate > topPerformer.metrics.completionRate && 
           metrics.consistency > topPerformer.metrics.consistency)) {
        topPerformer = { name: candidate, metrics };
      }
    }

    // Second pass: Generate SWOT analysis and insights for each candidate
    for (const [candidate, sessions] of Object.entries(candidateData)) {
      const metrics = candidateMetrics[candidate];
      const isTopPerformer = candidate === topPerformer.name;

      // Generate SWOT analysis
      const strengths = [];
      const weaknesses = [];
      const opportunities = [];
      const threats = [];

      if (metrics.completionRate >= 85) strengths.push("High completion rate");
      if (metrics.consistency >= 85) strengths.push("Consistent performance");
      if (metrics.timeManagement >= 85) strengths.push("Excellent time management");

      if (metrics.completionRate < 70) weaknesses.push("Low completion rate");
      if (metrics.consistency < 70) weaknesses.push("Inconsistent performance");
      if (metrics.timeManagement < 70) weaknesses.push("Poor time management");

      if (metrics.totalSessions < 12) {
        opportunities.push("Room for session completion improvement");
      }
      if (metrics.consistency < topPerformer.metrics!.consistency) {
        opportunities.push("Can improve consistency to match top performer");
      }

      if (metrics.totalSessions < 8 && metrics.completionRate < 75) {
        threats.push("Risk of not completing required sessions in time");
      }
      if (metrics.consistency < 60) {
        threats.push("Inconsistency may impact overall performance");
      }

      // Generate comparative analysis with top performer
      let comparativeInsight = "";
      if (!isTopPerformer) {
        const completionDiff = topPerformer.metrics!.completionRate - metrics.completionRate;
        const consistencyDiff = topPerformer.metrics!.consistency - metrics.consistency;
        
        comparativeInsight = `\nComparison with top performer (${topPerformer.name}):` +
          `\n- Completion rate: ${completionDiff.toFixed(1)}% lower` +
          `\n- Consistency: ${consistencyDiff.toFixed(1)}% lower`;
      }

      const analysis = `Performance Analysis for ${candidate}:
SWOT Analysis:
Strengths: ${strengths.join(", ") || "None identified"}
Weaknesses: ${weaknesses.join(", ") || "None identified"}
Opportunities: ${opportunities.join(", ") || "None identified"}
Threats: ${threats.join(", ") || "None identified"}

Key Metrics:
- Sessions completed: ${metrics.totalSessions}/14
- Completion rate: ${metrics.completionRate.toFixed(1)}%
- Consistency score: ${metrics.consistency.toFixed(1)}%
- Time management score: ${metrics.timeManagement.toFixed(1)}%
${comparativeInsight}

Status: ${metrics.totalSessions >= 12 ? "Qualified" : "In Progress"}`;

      // Store analysis in Supabase
      const { error: insertError } = await supabase
        .from('session_analysis')
        .insert({
          candidate_name: candidate,
          analysis: analysis,
          created_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-sessions function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
