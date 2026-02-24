"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { profileMemberSchema } from "@/features/profile/schemas/members";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  patchApiUserMembersByIdMutation,
  getApiUserMembersOptions,
} from "@/lib/sdk/@tanstack/react-query.gen";
import type { GetApiUserMembersResponses } from "@/lib/sdk";
import { formatApiError } from "@/lib/utils";

type Member = GetApiUserMembersResponses[200][number];

type EditMemberFormProps = {
  member: Member;
  onSuccess?: () => void;
};

export function EditMemberForm({ member, onSuccess }: EditMemberFormProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...patchApiUserMembersByIdMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getApiUserMembersOptions().queryKey,
      });
      toast.success("Member updated successfully");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(formatApiError(error) || "Failed to update member");
    },
  });

  const form = useForm<z.infer<typeof profileMemberSchema>>({
    resolver: zodResolver(profileMemberSchema),
    defaultValues: {
      firstName: member.firstName,
      lastName: member.lastName,
      birthDate: member.birthDate?.split("T")[0] || "",
      gender: member.gender,
      addressLine1: member.addressLine1 || "",
      city: member.city || "",
      postalCode: member.postalCode || "",
      country: member.country || "",
      relationshipToUser: member.relationshipToUser || undefined,
    },
  });

  async function onSubmit(values: z.infer<typeof profileMemberSchema>) {
    await mutation.mutateAsync({
      path: { id: member.id },
      body: values,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornavn</FormLabel>
                <FormControl>
                  <Input
                    placeholder="T.d. Jón"
                    {...field}
                    autoComplete="given-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Eftirnavn</FormLabel>
                <FormControl>
                  <Input
                    placeholder="T.d. Jónsson"
                    {...field}
                    autoComplete="family-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="birthDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Føðingardagur</FormLabel>
                <FormControl>
                  <Input type="date" {...field} autoComplete="bday" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kyn</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Vel kyn" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Kallkyn</SelectItem>
                    <SelectItem value="female">kvennkyn</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="addressLine1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Addressa</FormLabel>
              <FormControl>
                <Input
                  placeholder="T.d. Gøtuvíkar 1"
                  {...field}
                  autoComplete="street-address"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Býur/bygd</FormLabel>
                <FormControl>
                  <Input
                    placeholder="T.d. Tórshavn"
                    {...field}
                    autoComplete="address-level2"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postnúmer</FormLabel>
                <FormControl>
                  <Input
                    placeholder="T.d. 100"
                    {...field}
                    autoComplete="postal-code"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Land</FormLabel>
              <FormControl>
                <Input
                  placeholder="T.d. Føroyar"
                  {...field}
                  autoComplete="country-name"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="relationshipToUser"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Samband</FormLabel>

              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Vel samband" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CHILD">Barn</SelectItem>
                  <SelectItem value="PARTNER">Maki</SelectItem>
                  <SelectItem value="GUARDIAN">Guardian</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Vel hvat samband hesin limur hevur við teg, t.d. tú sjálvur,
                barn ella maki.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Updating..." : "Update Member"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
