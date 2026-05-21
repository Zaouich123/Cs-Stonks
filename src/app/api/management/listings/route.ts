import { handleRouteError, readOptionalJson, successResponse } from "@/lib/api";
import { ManagementService } from "@/modules/management/services/managementService";
import { requireManagementSession } from "@/modules/management/services/requireManagementSession";

export async function GET() {
  try {
    const session = await requireManagementSession();
    const listings = await new ManagementService().listListings(session.user.id);

    return successResponse({ listings });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireManagementSession();
    const listings = await new ManagementService().createListing(
      session.user.id,
      await readOptionalJson(request),
    );

    return successResponse({ listings }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
