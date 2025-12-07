"use client";

import { useState, useEffect } from "react";

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/campaigns", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Check if response is ok
      if (!response.ok) {
        // Check if response is HTML (error page)
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error(
            `Server returned HTML instead of JSON (${response.status}). API route may not exist.`
          );
        }
        throw new Error(
          `Failed to fetch campaigns: ${response.status} ${response.statusText}`
        );
      }

      // Check if response is JSON before parsing
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Server returned non-JSON response: ${contentType}. Response: ${text.substring(
            0,
            100
          )}`
        );
      }

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

      // Emails are now included in the API response
      setCampaigns(result.data);
      setError(null);
    } catch (err: any) {
      // Handle network errors gracefully
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        console.warn(
          "Network error fetching campaigns - server may not be running or network unavailable"
        );
        setError("Unable to connect to server. Please check your connection.");
        // Don't clear campaigns on network error - keep existing data
        return;
      }
      setError(err.message);
      console.error("Error fetching campaigns:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();

    // Auto-refresh campaigns every 10 seconds to get updated stats from webhooks
    // Use a ref to track loading state to avoid dependency issues
    let isRefreshing = false;
    const interval = setInterval(() => {
      if (!isRefreshing) {
        isRefreshing = true;
        fetchCampaigns()
          .catch((err) => {
            // Silently handle errors in auto-refresh to prevent console spam
            console.debug(
              "Auto-refresh campaigns error (silenced):",
              err.message
            );
          })
          .finally(() => {
            isRefreshing = false;
          });
      }
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []); // Empty dependency array - fetchCampaigns is stable

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
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // Check if response is ok
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error(
            `Server returned HTML instead of JSON (${response.status}). API route may not exist.`
          );
        }
        throw new Error(
          `Failed to fetch campaign: ${response.status} ${response.statusText}`
        );
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Server returned non-JSON response: ${contentType}. Response: ${text.substring(
            0,
            100
          )}`
        );
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data) {
        setCampaign(result.data);
      } else {
        setCampaign(null);
      }
      setError(null);
    } catch (err: any) {
      // Handle network errors gracefully
      if (err.message === "Failed to fetch" || err.name === "TypeError") {
        console.warn(
          "Network error fetching campaign - server may not be running or network unavailable"
        );
        setError("Unable to connect to server. Please check your connection.");
        return;
      }
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

    // Check if response is ok
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          `Server returned HTML instead of JSON (${response.status}). API route may not exist.`
        );
      }
      throw new Error(
        `Failed to create campaign: ${response.status} ${response.statusText}`
      );
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(
        `Server returned non-JSON response: ${contentType}. Response: ${text.substring(
          0,
          100
        )}`
      );
    }

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
  try {
    const response = await fetch(`/api/campaigns/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Check if response is ok
    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        throw new Error(
          `Server returned HTML instead of JSON (${response.status}). API route may not exist.`
        );
      }
      throw new Error(
        `Failed to delete campaign: ${response.status} ${response.statusText}`
      );
    }

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      throw new Error(
        `Server returned non-JSON response: ${contentType}. Response: ${text.substring(
          0,
          100
        )}`
      );
    }

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
