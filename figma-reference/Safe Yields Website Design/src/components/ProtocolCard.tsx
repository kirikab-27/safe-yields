import { CheckCircle, Shield, Bug, TrendingUp } from "lucide-react";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

interface Protocol {
  id: string;
  name: string;
  logo: string;
  verified: boolean;
  chain: string;
  category: string;
  tvl: string;
  apy: string;
  safetyScore: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  audits: string[];
  description: string;
  hasInsurance: boolean;
  bugBounty: boolean;
  noHacks: boolean;
}

interface ProtocolCardProps {
  protocol: Protocol;
}

export function ProtocolCard({ protocol }: ProtocolCardProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "LOW":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "MEDIUM":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "HIGH":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getSafetyScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300">
      <div className="flex items-start justify-between">
        {/* Left Section */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-lg">{protocol.logo}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{protocol.name}</h3>
                {protocol.verified && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {protocol.chain}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {protocol.category}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <div className="text-sm text-gray-400 mb-1">TVL: {protocol.tvl}</div>
            <div className="flex items-center gap-2 mb-2">
              {protocol.audits.map((audit, index) => (
                <Badge key={index} variant="outline" className="text-xs border-green-500/30 text-green-400">
                  {audit}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-gray-300">{protocol.description}</p>
          </div>
        </div>

        {/* Right Section */}
        <div className="ml-6 text-right">
          <div className="mb-4">
            <div className="text-3xl font-bold text-green-400 mb-1">
              {protocol.apy}
            </div>
            <div className="text-sm text-gray-400">APY</div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-end gap-2 mb-2">
              <span className={`text-lg font-bold ${getSafetyScoreColor(protocol.safetyScore)}`}>
                {protocol.safetyScore}
              </span>
              <Shield className="w-4 h-4 text-gray-400" />
            </div>
            <Progress 
              value={protocol.safetyScore} 
              className="w-20 h-2"
            />
            <div className="text-xs text-gray-400 mt-1">Safety Score</div>
          </div>

          <Badge className={`mb-3 ${getRiskColor(protocol.risk)}`}>
            {protocol.risk}
          </Badge>

          <div className="flex items-center justify-end gap-2 text-xs">
            {protocol.hasInsurance && (
              <Badge variant="outline" className="text-green-400 border-green-500/30">
                Insurance
              </Badge>
            )}
            {protocol.bugBounty && (
              <Badge variant="outline" className="text-blue-400 border-blue-500/30">
                Bug Bounty
              </Badge>
            )}
            {protocol.noHacks && (
              <Badge variant="outline" className="text-green-400 border-green-500/30">
                No Hacks
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}