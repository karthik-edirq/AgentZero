"use client";

// Mock data for serverless mode
const MOCK_CAMPAIGNS = [
  {
    id: "1",
    name: "Campaign 1",
    status: "active",
    totalSent: 14,
    sent: 0,
    delivered: 9,
    opened: 0,
    clicked: 1,
    openRate: 0.0,
    clickRate: 7.1,
    emails: [
      {
        id: "1",
        status: "delivered",
        recipient: "***@gmail.com",
        subject: "Thank you for speaking at the Supabase Select Hackathon",
        sentAt: "4:50:06 PM",
      },
      {
        id: "2",
        status: "delivered",
        recipient: "***@datadoghq.com",
        subject:
          "Datadog speaker update: new Resend prize category announced at the hackathon",
        sentAt: "4:50:26 PM",
      },
      {
        id: "3",
        status: "bounced",
        recipient: "***@supabase.io",
        subject: "Redeem your Resend API credits for the Hackathon",
        sentAt: "4:50:39 PM",
      },
      {
        id: "4",
        status: "delivered",
        recipient: "***@snapchat.com",
        subject: "Your Resend API credits for the Hackathon, Jake",
        sentAt: "4:50:59 PM",
      },
    ],
  },
  {
    id: "2",
    name: "Q1 2025 Security Training",
    status: "active",
    totalSent: 250,
    sent: 0,
    delivered: 245,
    opened: 85,
    clicked: 23,
    openRate: 34.7,
    clickRate: 9.2,
    emails: [],
  },
  {
    id: "3",
    name: "Executive Phishing Simulation",
    status: "completed",
    totalSent: 45,
    sent: 0,
    delivered: 45,
    opened: 18,
    clicked: 8,
    openRate: 40.0,
    clickRate: 17.8,
    emails: [],
  },
];

export function useCampaigns() {
  return {
    campaigns: MOCK_CAMPAIGNS,
    isLoading: false,
    error: null,
    refresh: () => Promise.resolve(),
  };
}

export function useCampaign(id: string) {
  const campaign = MOCK_CAMPAIGNS.find((c) => c.id === id);
  return {
    campaign: campaign || null,
    isLoading: false,
    error: null,
    refresh: () => Promise.resolve(),
  };
}

export async function createCampaign(campaignData: any) {
  return {
    data: { ...campaignData, id: String(MOCK_CAMPAIGNS.length + 1) },
    status: 200,
  };
}

export async function updateCampaign(id: string, campaignData: any) {
  return { data: { ...campaignData, id }, status: 200 };
}

export async function deleteCampaign(id: string) {
  return { data: { id }, status: 200 };
}
