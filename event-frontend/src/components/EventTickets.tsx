"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import {
  MapPin,
  Calendar,
  Clock,
  Ticket,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Wallet,
  DollarSign,
  Users,
  RefreshCw,
  ArrowRight,
  Shield,
  Gift,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import contractABI from "@/contract/abi.json";
import { getTokenByAddress } from "@/utils/tokens";

const CONTRACT_ADDRESS = "0x1b5F100B02f07E7A88f6C3A2B08152009d06685e";

interface Event {
  id: string;
  owner: string;
  eventName: string;
  eventCardImgUrl: string;
  eventDetails: string;
  startDate: number;
  endDate: number;
  startTime: number;
  endTime: number;
  eventLocation: string;
  isActive: boolean;
  ticketPrice: number;
  fundsHeld: number;
  minimumAge: number;
  maxCapacity: number;
  isCanceled: boolean;
  fundsReleased: boolean;
  exists: boolean;
  refundPolicy: number;
  refundBufferHours: number;
  paymentToken: string;
}

const REFUND_POLICY_NAMES = {
  0: "No Refunds",
  1: "Before Event Start",
  2: "Custom Buffer Period",
};

const toastConfig = {
  success: {
    duration: 4000,
    icon: "✅",
    style: {
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "#fff",
      fontWeight: "600",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)",
    },
  },
  error: {
    duration: 5000,
    icon: "❌",
    style: {
      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
      color: "#fff",
      fontWeight: "600",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(239, 68, 68, 0.3)",
    },
  },
  loading: {
    icon: "⏳",
    style: {
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      color: "#fff",
      fontWeight: "600",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)",
    },
  },
  info: {
    duration: 3000,
    icon: "ℹ️",
    style: {
      background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
      color: "#fff",
      fontWeight: "600",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(99, 102, 241, 0.3)",
    },
  },
};

export default function EventTickets() {
  const [events, setEvents] = useState<Event[]>([]);
  const [pendingWithdrawal, setPendingWithdrawal] = useState<number>(0);
  const { address, isConnected } = useAccount();
  const [refundLoading, setRefundLoading] = useState<Record<string, boolean>>(
    {},
  );
  const { writeContractAsync } = useWriteContract();

  const {
    data,
    error: contractError,
    isLoading,
    isError,
    isSuccess,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractABI.abi,
    functionName: "getUserEvents",
    args: [address],
  });

  const { data: pendingWithdrawalData, refetch: refetchPendingWithdrawal } =
    useReadContract({
      address: CONTRACT_ADDRESS,
      abi: contractABI.abi,
      functionName: "getPendingWithdrawal",
      args: [address],
    });

  useEffect(() => {
    if (pendingWithdrawalData) {
      const withdrawal = Number(pendingWithdrawalData) / 1e18;
      setPendingWithdrawal(withdrawal);
    }
  }, [pendingWithdrawalData]);

  useEffect(() => {
    if (isError) {
      console.error("🚨 Contract read error:", {
        error: contractError,
        contractAddress: CONTRACT_ADDRESS,
        functionName: "getUserEvents",
        timestamp: new Date().toISOString(),
      });
    }
  }, [isError, contractError]);

  useEffect(() => {
    if (isSuccess && data) {
      try {
        if (!Array.isArray(data) || data.length !== 2) {
          throw new Error("Unexpected data format from contract");
        }

        const [eventIds, userEvents] = data as [string[], any[]];

        const formattedEvents = userEvents.map((event, index) => {
          const token = getTokenByAddress(event.paymentToken);
          const decimals = token?.decimals || 18;

          return {
            id: eventIds[index],
            owner: event.owner,
            eventName: event.eventName,
            eventCardImgUrl: event.eventCardImgUrl,
            eventDetails: event.eventDetails,
            startDate: Number(event.startDate),
            endDate: Number(event.endDate),
            startTime: Number(event.startTime),
            endTime: Number(event.endTime),
            eventLocation: event.eventLocation,
            isActive: event.isActive,
            ticketPrice: Number(event.ticketPrice) / Math.pow(10, decimals),
            fundsHeld: Number(event.fundsHeld) / Math.pow(10, decimals),
            minimumAge: Number(event.minimumAge),
            maxCapacity: Number(event.maxCapacity),
            isCanceled: event.isCanceled,
            fundsReleased: event.fundsReleased,
            exists: event.exists,
            refundPolicy: Number(event.refundPolicy),
            refundBufferHours: Number(event.refundBufferHours),
            paymentToken: event.paymentToken,
          };
        });

        setEvents(formattedEvents);
      } catch (error) {
        console.error("🚨 Error processing user events data:", {
          error: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
          data,
          timestamp: new Date().toISOString(),
        });
        toast.error("Failed to load events data", toastConfig.error);
      }
    }
  }, [isSuccess, data]);

  const requestRefund = async (id: string) => {
    if (!isConnected || !address) {
      toast.error("🔌 Please connect your wallet first", toastConfig.error);
      return;
    }

    setRefundLoading((prev) => ({ ...prev, [id]: true }));
    const toastId = toast.loading(
      "⏳ Processing refund request...",
      toastConfig.loading,
    );

    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "requestRefund",
        args: [BigInt(id)],
      });

      toast.dismiss(toastId);
      toast.success("💰 Refund requested successfully!", toastConfig.success);

      await refetch();
      await refetchPendingWithdrawal();

      setTimeout(() => {
        toast.success("✅ Funds added to pending withdrawal", toastConfig.info);
      }, 1000);
    } catch (error: any) {
      console.error("Refund error:", error);
      toast.dismiss(toastId);
      const errorMsg =
        error?.shortMessage || error?.message || "Refund request failed";
      toast.error(`❌ ${errorMsg}`, toastConfig.error);
    } finally {
      setRefundLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleWithdrawFunds = async () => {
    if (!address) {
      toast.error("🔌 Please connect your wallet first", toastConfig.error);
      return;
    }

    const toastId = toast.loading(
      "⏳ Withdrawing funds...",
      toastConfig.loading,
    );

    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: contractABI.abi,
        functionName: "withdraw",
      });

      toast.dismiss(toastId);
      toast.success("💸 Withdrawal successful!", toastConfig.success);

      await refetchPendingWithdrawal();

      setTimeout(() => {
        toast.success("✅ Funds sent to your wallet", toastConfig.info);
      }, 1000);
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      toast.dismiss(toastId);
      const errorMsg =
        error?.shortMessage || error?.message || "Withdrawal failed";
      toast.error(`❌ ${errorMsg}`, toastConfig.error);
    }
  };

  const getEventStatus = (event: Event) => {
    if (event.isCanceled)
      return {
        text: "Cancelled",
        color: "text-red-600",
        bg: "bg-red-50",
        borderColor: "border-red-200",
        icon: XCircle,
      };
    if (!event.isActive)
      return {
        text: "Inactive",
        color: "text-gray-600",
        bg: "bg-gray-50",
        borderColor: "border-gray-200",
        icon: AlertCircle,
      };

    const now = Date.now() / 1000;

    if (now < event.startDate)
      return {
        text: "Upcoming",
        color: "text-blue-600",
        bg: "bg-blue-50",
        borderColor: "border-blue-200",
        icon: Clock,
      };
    if (now >= event.startDate && now <= event.endDate)
      return {
        text: "Live Now",
        color: "text-green-600",
        bg: "bg-green-50",
        borderColor: "border-green-200",
        icon: CheckCircle,
      };
    return {
      text: "Ended",
      color: "text-gray-600",
      bg: "bg-gray-50",
      borderColor: "border-gray-200",
      icon: CheckCircle,
    };
  };

  const getRefundEligibility = (event: Event) => {
    if (event.isCanceled)
      return {
        eligible: true,
        reason: "Event cancelled - Full refund available",
      };

    const now = Date.now() / 1000;

    if (event.refundPolicy === 0) {
      return { eligible: false, reason: "No refunds for this event" };
    } else if (event.refundPolicy === 1) {
      if (now < event.startDate) {
        return {
          eligible: true,
          reason: "Refund available before event starts",
        };
      }
      return { eligible: false, reason: "Event has started" };
    } else if (event.refundPolicy === 2) {
      const refundDeadline = event.startDate - event.refundBufferHours * 3600;
      if (now < refundDeadline) {
        const hoursLeft = Math.floor((refundDeadline - now) / 3600);
        return {
          eligible: true,
          reason: `${hoursLeft}h until refund deadline`,
        };
      }
      return {
        eligible: false,
        reason: `${event.refundBufferHours}h buffer period expired`,
      };
    }

    return { eligible: false, reason: "Unknown refund policy" };
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const formatPrice = (price: number, tokenAddress: string) => {
    const token = getTokenByAddress(tokenAddress);
    const symbol = token?.symbol || "Unknown";

    if (token?.decimals === 6) {
      return `${price.toFixed(6)} ${symbol}`;
    }

    return `${price.toFixed(4)} ${symbol}`;
  };

  const getImageUrl = (event: Event) => {
    if (!event.eventCardImgUrl) return "/default-event.jpg";
    return event.eventCardImgUrl.startsWith("http")
      ? event.eventCardImgUrl
      : `https://ipfs.io/ipfs/${event.eventCardImgUrl}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <Toaster position="top-right" />
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <Wallet className="w-20 h-20 mx-auto mb-6 text-indigo-600" />
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Connect Your Wallet
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Access your event tickets and manage refunds
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <Toaster position="top-right" />
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <Loader2 className="w-16 h-16 mx-auto mb-6 text-indigo-600 animate-spin" />
            <p className="text-gray-600 text-lg">Loading your tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
              My Tickets
            </h1>
            <p className="text-gray-600 text-lg">
              Manage tickets and process refunds with pull payment
            </p>
          </div>
        </div>

        {pendingWithdrawal > 0 && (
          <div className="mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-xl p-6 border-2 border-emerald-400">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <div className="text-white">
                  <p className="text-sm font-medium opacity-90 mb-1">
                    Pending Withdrawal
                  </p>
                  <p className="text-3xl font-bold">
                    {pendingWithdrawal.toFixed(4)} CELO
                  </p>
                  <p className="text-sm opacity-75 mt-1">
                    Pull payment pattern - withdraw when ready
                  </p>
                </div>
              </div>
              <button
                onClick={handleWithdrawFunds}
                className="w-full sm:w-auto px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Withdraw Funds
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <Ticket className="w-20 h-20 mx-auto mb-6 text-gray-400" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              No Tickets Yet
            </h2>
            <p className="text-gray-600 text-lg">
              Start exploring events and purchase your first ticket!
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {events.map((event) => {
              const status = getEventStatus(event);
              const StatusIcon = status.icon;
              const refundInfo = getRefundEligibility(event);

              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 ${status.borderColor}`}
                >
                  <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-80 h-56 lg:h-auto bg-gradient-to-br from-indigo-100 to-purple-100 flex-shrink-0 relative overflow-hidden">
                      <img
                        src={getImageUrl(event)}
                        alt={event.eventName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                      <div
                        className={`absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md ${status.bg} border-2 ${status.borderColor}`}
                      >
                        <StatusIcon className={`w-5 h-5 ${status.color}`} />
                        <span className={`text-sm font-bold ${status.color}`}>
                          {status.text}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 p-6">
                      <div className="mb-4">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                          {event.eventName}
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                          {event.eventDetails}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                              Location
                            </p>
                            <p className="text-gray-900 font-medium">
                              {event.eventLocation}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                              Dates
                            </p>
                            <p className="text-gray-900 font-medium">
                              {formatDate(event.startDate)} -{" "}
                              {formatDate(event.endDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Clock className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                              Time
                            </p>
                            <p className="text-gray-900 font-medium">
                              {formatTime(event.startTime)} -{" "}
                              {formatTime(event.endTime)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Ticket className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                              Ticket Price
                            </p>
                            <p className="text-gray-900 font-bold text-xl">
                              {formatPrice(
                                event.ticketPrice,
                                event.paymentToken,
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Users className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                              Capacity
                            </p>
                            <p className="text-gray-900 font-medium">
                              {event.maxCapacity} attendees
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">
                              Refund Policy
                            </p>
                            <p className="text-gray-900 font-medium">
                              {
                                REFUND_POLICY_NAMES[
                                  event.refundPolicy as keyof typeof REFUND_POLICY_NAMES
                                ]
                              }
                            </p>
                            {event.refundPolicy === 2 && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {event.refundBufferHours}h buffer period
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`mb-4 p-4 rounded-xl border-2 ${
                          refundInfo.eligible
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {refundInfo.eligible ? (
                            <Gift className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-gray-600 flex-shrink-0" />
                          )}
                          <p
                            className={`text-sm font-semibold ${
                              refundInfo.eligible
                                ? "text-green-700"
                                : "text-gray-700"
                            }`}
                          >
                            {refundInfo.reason}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t-2 border-gray-100">
                        <button
                          onClick={() => requestRefund(event.id)}
                          disabled={
                            refundLoading[event.id] || !refundInfo.eligible
                          }
                          className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                        >
                          {refundLoading[event.id] ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Processing Refund...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-5 h-5" />
                              Request Refund
                            </>
                          )}
                        </button>

                        {!refundInfo.eligible && !event.isCanceled && (
                          <p className="text-sm text-gray-500 italic mt-3">
                            Refunds are no longer available for this event
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
