import { describe, expect, it } from "vitest";
import { evaluateContract, getContractForRound } from "../src/domain/contracts";
import { createDefaultProgress, resolveRunRound } from "../src/domain/progression";

const paperWin = {
  playerOne: { id: "paper", element: "paper" as const, level: 1 },
  playerTwo: { id: "rock", element: "rock" as const, level: 10 },
  winner: "PLAYER_ONE" as const,
};

describe("optional match contracts", () => {
  it("rotates deterministic offers by round", () => {
    expect(getContractForRound(1).id).toBe("HOUSE_FAVOR");
    expect(getContractForRound(5).id).toBe("HOUSE_FAVOR");
  });

  it("clears House Favor after a Paper hand and adds its payout", () => {
    const contract = evaluateContract("HOUSE_FAVOR", {
      won: true,
      doubled: false,
      playerScore: 2,
      opponentScore: 1,
      history: [paperWin],
    });
    expect(contract.completed).toBe(true);
    const result = resolveRunRound(createDefaultProgress(), true, "paper", false, 0, 0, contract);
    expect(result.reward.earned).toBe(7);
    expect(result.reward.contractReward).toBe("+4 CHIPS");
  });

  it("rewards a clean 2–0 with permanent-for-run MULT", () => {
    const contract = evaluateContract("COLD_TABLE", {
      won: true,
      doubled: false,
      playerScore: 2,
      opponentScore: 0,
      history: [paperWin],
    });
    const result = resolveRunRound(createDefaultProgress(), true, "paper", false, 0, 0, contract);
    expect(result.progress.run.multiplierLevel).toBe(1);
    expect(result.reward.contractCompleted).toBe(true);
  });

  it("rewards The Cut with a deterministic random run item", () => {
    const contract = evaluateContract("THE_CUT", {
      won: true,
      doubled: false,
      playerScore: 2,
      opponentScore: 1,
      history: [{
        playerOne: { id: "scissors", element: "scissors", level: 1 },
        playerTwo: { id: "paper", element: "paper", level: 10 },
        winner: "PLAYER_ONE",
      }],
    }, () => 0);
    expect(contract.completed).toBe(true);
    expect(contract.item).toBe("loaded-coin");
    const result = resolveRunRound(createDefaultProgress(), true, "scissors", false, 0, 0, contract);
    expect(result.progress.run.items["loaded-coin"]).toBe(1);
    expect(result.reward.contractReward).toBe("+1 LOADED COIN");
  });

  it("does not punish a missed contract", () => {
    const contract = evaluateContract("THE_CUT", {
      won: true,
      doubled: false,
      playerScore: 2,
      opponentScore: 1,
      history: [paperWin],
    });
    expect(contract.completed).toBe(false);
    expect(contract.item).toBeNull();
  });
});
