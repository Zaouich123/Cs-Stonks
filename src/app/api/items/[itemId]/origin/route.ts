import { handleRouteError, successResponse } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { normalizeSearchText } from "@/modules/catalog/catalog.normalizer";
import { ItemType } from "@prisma/client";

function tokenize(value: string | null | undefined) {
  return normalizeSearchText(value ?? "")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 2)
    .filter((token) => !["case", "weapon", "collection", "the"].includes(token));
}

function getKnownCaseNames(input: {
  baseItemName: string | null;
  itemType: ItemType;
  skinName: string | null;
}) {
  const baseName = input.baseItemName ?? "";
  const skinName = input.skinName ?? "";

  if (input.itemType === ItemType.KNIFE || input.itemType === ItemType.GLOVE) {
    if (baseName.includes("Gamma Doppler") || skinName.includes("Gamma Doppler")) {
      return ["Gamma Case", "Gamma 2 Case"];
    }

    if (
      baseName.includes("Doppler") ||
      baseName.includes("Marble Fade") ||
      baseName.includes("Tiger Tooth") ||
      baseName.includes("Damascus Steel") ||
      baseName.includes("Rust Coat") ||
      baseName.includes("Ultraviolet") ||
      skinName.includes("Doppler") ||
      skinName.includes("Marble Fade") ||
      skinName.includes("Tiger Tooth") ||
      skinName.includes("Damascus Steel") ||
      skinName.includes("Rust Coat") ||
      skinName.includes("Ultraviolet")
    ) {
      return ["Chroma Case", "Chroma 2 Case", "Chroma 3 Case"];
    }
  }

  return [];
}

function scoreCaseMatch(caseItem: { collection: string | null; displayName: string; searchText: string }, tokens: string[]) {
  let score = 0;

  for (const token of tokens) {
    if (caseItem.displayName.toLowerCase().includes(token)) {
      score += 3;
    }

    if (caseItem.collection?.toLowerCase().includes(token)) {
      score += 2;
    }

    if (caseItem.searchText.includes(token)) {
      score += 1;
    }
  }

  return score;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await context.params;

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: {
        baseItemName: true,
        collection: true,
        displayName: true,
        id: true,
        itemType: true,
        skinName: true,
      },
    });

    if (!item) {
      return successResponse(
        {
          collection: null,
          dropCases: [],
        },
        404,
      );
    }

    const knownCaseNames = getKnownCaseNames(item);
    const exactCases = knownCaseNames.length
      ? await prisma.item.findMany({
          where: {
            itemType: ItemType.CASE,
            displayName: {
              in: knownCaseNames,
            },
            isActive: true,
          },
          select: {
            collection: true,
            displayName: true,
            id: true,
            imageUrl: true,
            searchText: true,
            steamImageUrl: true,
          },
        })
      : [];

    const collectionTokens = tokenize(item.collection);
    const collectionCases = collectionTokens.length
      ? await prisma.item.findMany({
          where: {
            itemType: ItemType.CASE,
            isActive: true,
            OR: collectionTokens.map((token) => ({
              searchText: {
                contains: token,
              },
            })),
          },
          select: {
            collection: true,
            displayName: true,
            id: true,
            imageUrl: true,
            searchText: true,
            steamImageUrl: true,
          },
          take: 20,
        })
      : [];

    const mergedCases = [...exactCases, ...collectionCases]
      .filter(
        (caseItem, index, array) => array.findIndex((candidate) => candidate.id === caseItem.id) === index,
      )
      .map((caseItem) => ({
        ...caseItem,
        score: knownCaseNames.includes(caseItem.displayName)
          ? 100
          : scoreCaseMatch(caseItem, collectionTokens),
      }))
      .sort((left, right) => right.score - left.score || left.displayName.localeCompare(right.displayName))
      .slice(0, 4)
      .map(({ collection, displayName, id, imageUrl, steamImageUrl }) => ({
        collection,
        displayName,
        id,
        imageUrl,
        steamImageUrl,
      }));

    return successResponse({
      collection: item.collection,
      dropCases: mergedCases,
      inferredFromFinish: item.collection ? false : knownCaseNames.length > 0,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
