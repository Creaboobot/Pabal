"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { PeopleActionState } from "@/modules/people/action-state";
import {
  companyAffiliationFormSchema,
  companyFormSchema,
  editAffiliationFormSchema,
  formDataValue,
  personAffiliationFormSchema,
  personFormSchema,
  toFieldErrors,
} from "@/modules/people/validation";
import {
  archiveTenantCompanyAffiliation,
  createTenantCompanyAffiliation,
  endTenantCompanyAffiliation,
  updateTenantCompanyAffiliation,
} from "@/server/services/company-affiliations";
import {
  archiveTenantCompany,
  createTenantCompany,
  updateTenantCompany,
} from "@/server/services/companies";
import {
  archiveTenantPerson,
  createTenantPerson,
  updateTenantPerson,
} from "@/server/services/people";
import { TenantScopedEntityNotFoundError } from "@/server/services/relationship-entities";
import { getCurrentUserContext } from "@/server/services/session";

async function requireActionContext(callbackUrl: string) {
  const context = await getCurrentUserContext();

  if (!context) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return context;
}

function personFormData(formData: FormData) {
  return {
    displayName: formDataValue(formData, "displayName"),
    email: formDataValue(formData, "email"),
    firstName: formDataValue(formData, "firstName"),
    jobTitle: formDataValue(formData, "jobTitle"),
    lastName: formDataValue(formData, "lastName"),
    linkedinUrl: formDataValue(formData, "linkedinUrl"),
    phone: formDataValue(formData, "phone"),
    relationshipStatus: formDataValue(formData, "relationshipStatus"),
    relationshipTemperature: formDataValue(
      formData,
      "relationshipTemperature",
    ),
    salesNavigatorUrl: formDataValue(formData, "salesNavigatorUrl"),
  };
}

function companyFormData(formData: FormData) {
  return {
    description: formDataValue(formData, "description"),
    industry: formDataValue(formData, "industry"),
    name: formDataValue(formData, "name"),
    website: formDataValue(formData, "website"),
  };
}

function affiliationFormData(formData: FormData) {
  return {
    affiliationTitle: formDataValue(formData, "affiliationTitle"),
    companyId: formDataValue(formData, "companyId"),
    department: formDataValue(formData, "department"),
    endsAt: formDataValue(formData, "endsAt"),
    isPrimary: formData.get("isPrimary") === "on",
    personId: formDataValue(formData, "personId"),
    startsAt: formDataValue(formData, "startsAt"),
  };
}

function inputDate(value: string | null | undefined) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function mutationError(error: unknown): PeopleActionState {
  if (error instanceof TenantScopedEntityNotFoundError) {
    return {
      message: "That record was not found in this workspace.",
      status: "error",
    };
  }

  return {
    message: "The record could not be saved. Please try again.",
    status: "error",
  };
}

export async function createPersonAction(
  formData: FormData,
): Promise<PeopleActionState> {
  const parsed = personFormSchema.safeParse(personFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext("/people/new");

  try {
    const person = await createTenantPerson(context, parsed.data);

    revalidatePath("/people");

    return {
      redirectTo: `/people/${person.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function updatePersonAction(
  personId: string,
  formData: FormData,
): Promise<PeopleActionState> {
  const parsed = personFormSchema.safeParse(personFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(`/people/${personId}/edit`);

  try {
    const person = await updateTenantPerson(context, personId, parsed.data);

    revalidatePath("/people");
    revalidatePath(`/people/${person.id}`);

    return {
      redirectTo: `/people/${person.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function archivePersonAction(
  personId: string,
): Promise<PeopleActionState> {
  const context = await requireActionContext(`/people/${personId}`);

  try {
    await archiveTenantPerson(context, personId);

    revalidatePath("/people");

    return {
      redirectTo: "/people",
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function createCompanyAction(
  formData: FormData,
): Promise<PeopleActionState> {
  const parsed = companyFormSchema.safeParse(companyFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext("/people/companies/new");

  try {
    const company = await createTenantCompany(context, parsed.data);

    revalidatePath("/people");
    revalidatePath("/people/companies");

    return {
      redirectTo: `/people/companies/${company.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function updateCompanyAction(
  companyId: string,
  formData: FormData,
): Promise<PeopleActionState> {
  const parsed = companyFormSchema.safeParse(companyFormData(formData));

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(
    `/people/companies/${companyId}/edit`,
  );

  try {
    const company = await updateTenantCompany(context, companyId, parsed.data);

    revalidatePath("/people");
    revalidatePath("/people/companies");
    revalidatePath(`/people/companies/${company.id}`);

    return {
      redirectTo: `/people/companies/${company.id}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function archiveCompanyAction(
  companyId: string,
): Promise<PeopleActionState> {
  const context = await requireActionContext(`/people/companies/${companyId}`);

  try {
    await archiveTenantCompany(context, companyId);

    revalidatePath("/people");
    revalidatePath("/people/companies");

    return {
      redirectTo: "/people/companies",
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function createPersonAffiliationAction(
  personId: string,
  formData: FormData,
): Promise<PeopleActionState> {
  const parsed = personAffiliationFormSchema.safeParse(
    affiliationFormData(formData),
  );

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(
    `/people/${personId}/affiliations/new`,
  );

  try {
    await createTenantCompanyAffiliation(context, {
      affiliationTitle: parsed.data.affiliationTitle,
      companyId: parsed.data.companyId,
      department: parsed.data.department,
      endsAt: inputDate(parsed.data.endsAt),
      isPrimary: parsed.data.isPrimary,
      personId,
      startsAt: inputDate(parsed.data.startsAt),
    });

    revalidatePath("/people");
    revalidatePath(`/people/${personId}`);
    revalidatePath(`/people/companies/${parsed.data.companyId}`);

    return {
      redirectTo: `/people/${personId}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function createCompanyAffiliationAction(
  companyId: string,
  formData: FormData,
): Promise<PeopleActionState> {
  const parsed = companyAffiliationFormSchema.safeParse(
    affiliationFormData(formData),
  );

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(
    `/people/companies/${companyId}/affiliations/new`,
  );

  try {
    await createTenantCompanyAffiliation(context, {
      affiliationTitle: parsed.data.affiliationTitle,
      companyId,
      department: parsed.data.department,
      endsAt: inputDate(parsed.data.endsAt),
      isPrimary: parsed.data.isPrimary,
      personId: parsed.data.personId,
      startsAt: inputDate(parsed.data.startsAt),
    });

    revalidatePath("/people");
    revalidatePath(`/people/${parsed.data.personId}`);
    revalidatePath("/people/companies");
    revalidatePath(`/people/companies/${companyId}`);

    return {
      redirectTo: `/people/companies/${companyId}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function updateAffiliationAction(
  personId: string,
  affiliationId: string,
  formData: FormData,
): Promise<PeopleActionState> {
  const parsed = editAffiliationFormSchema.safeParse(
    affiliationFormData(formData),
  );

  if (!parsed.success) {
    return {
      fieldErrors: toFieldErrors(parsed.error),
      message: "Check the highlighted fields.",
      status: "error",
    };
  }

  const context = await requireActionContext(
    `/people/${personId}/affiliations/${affiliationId}/edit`,
  );

  try {
    const affiliation = await updateTenantCompanyAffiliation(
      context,
      personId,
      affiliationId,
      {
        affiliationTitle: parsed.data.affiliationTitle,
        companyId: parsed.data.companyId,
        department: parsed.data.department,
        endsAt: inputDate(parsed.data.endsAt),
        isPrimary: parsed.data.isPrimary,
        startsAt: inputDate(parsed.data.startsAt),
      },
    );

    revalidatePath("/people");
    revalidatePath(`/people/${personId}`);
    revalidatePath("/people/companies");
    revalidatePath(`/people/companies/${affiliation.companyId}`);

    return {
      redirectTo: `/people/${personId}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function endAffiliationAction(
  personId: string,
  affiliationId: string,
): Promise<PeopleActionState> {
  const context = await requireActionContext(`/people/${personId}`);

  try {
    const affiliation = await endTenantCompanyAffiliation(
      context,
      personId,
      affiliationId,
    );

    revalidatePath("/people");
    revalidatePath(`/people/${personId}`);
    revalidatePath(`/people/companies/${affiliation.companyId}`);

    return {
      redirectTo: `/people/${personId}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}

export async function archiveAffiliationAction(
  personId: string,
  affiliationId: string,
): Promise<PeopleActionState> {
  const context = await requireActionContext(
    `/people/${personId}/affiliations/${affiliationId}/edit`,
  );

  try {
    const affiliation = await archiveTenantCompanyAffiliation(
      context,
      personId,
      affiliationId,
    );

    revalidatePath("/people");
    revalidatePath(`/people/${personId}`);
    revalidatePath(`/people/companies/${affiliation.companyId}`);

    return {
      redirectTo: `/people/${personId}`,
      status: "success",
    };
  } catch (error) {
    return mutationError(error);
  }
}
