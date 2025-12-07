"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/campaigns");
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // If no campaigns, return empty array
      if (!result.data || result.data.length === 0) {
        setCampaigns([]);
        setError(null);
        return;
      }

      // Fetch emails for each campaign
      const campaignsWithEmails = await Promise.all(
        result.data.map(async (campaign: any) => {
          const { data: emails } = await supabase
            .from("emails")
            .select(
              `
              *,
              recipient:recipients(*)
            `
            )
            .eq("campaign_id", campaign.id)
            .order("sent_at", { ascending: false });

          return {
            ...campaign,
            emails: (emails || []).map((email: any) => ({
              id: email.id,
              status: email.status,
              recipient: email.recipient?.email || "Unknown",
              subject: email.subject,
              sentAt: email.sent_at
                ? new Date(email.sent_at).toLocaleTimeString()
                : "",
            })),
          };
        })
      );

      setCampaigns(campaignsWithEmails);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching campaigns:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return {
    campaigns,
    isLoading,
    error,
    refresh: fetchCampaigns,
  };
}

export function useCampaign(id: string) {
  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaign = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/campaigns");
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      const found = result.data.find((c: any) => c.id === id);
      if (found) {
        // Fetch emails for this campaign
        const { data: emails } = await supabase
          .from("emails")
          .select(
            `
            *,
            recipient:recipients(*)
          `
          )
          .eq("campaign_id", id)
          .order("sent_at", { ascending: false });

        setCampaign({
          ...found,
          emails: (emails || []).map((email: any) => ({
            id: email.id,
            status: email.status,
            recipient: email.recipient?.email || "Unknown",
            subject: email.subject,
            sentAt: email.sent_at
              ? new Date(email.sent_at).toLocaleTimeString()
              : "",
          })),
        });
      } else {
        setCampaign(null);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching campaign:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCampaign();
    }
  }, [id]);

  return {
    campaign,
    isLoading,
    error,
    refresh: fetchCampaign,
  };
}

export async function createCampaign(campaignData: any) {
  try {
    const response = await fetch("/api/campaigns", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(campaignData),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      data: result.data,
      status: response.status,
    };
  } catch (error: any) {
    return {
      data: null,
      status: 500,
      error: error.message,
    };
  }
}

export async function updateCampaign(id: string, campaignData: any) {
  // TODO: Implement update endpoint
  return { data: { ...campaignData, id }, status: 200 };
}

export async function deleteCampaign(id: string) {
  // TODO: Implement delete endpoint
  return { data: { id }, status: 200 };
}
