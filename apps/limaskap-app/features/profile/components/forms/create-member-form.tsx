"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
  postApiUserMembersMutation,
  getApiUserMembersOptions,
} from "@/lib/sdk/@tanstack/react-query.gen";
import { formatApiError } from "@/lib/utils";

type CreateMemberFormProps = {
  onSuccess?: () => void;
};

export function CreateMemberForm({ onSuccess }: CreateMemberFormProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    ...postApiUserMembersMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getApiUserMembersOptions().queryKey,
      });
      toast.success("Member created successfully");
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(formatApiError(error) || "Failed to create member");
    },
  });

  const form = useForm<z.infer<typeof profileMemberSchema>>({
    resolver: zodResolver(profileMemberSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthDate: "",
      gender: undefined,
      addressLine1: "",
      city: "",
      postalCode: "",
      country: "",
      relationshipToUser: undefined,
    },
  });

  function onSubmit(values: z.infer<typeof profileMemberSchema>) {
    mutation.mutate({ body: values });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md">
            <p className="text-sm">{error}</p>
          </div>
        )} */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter first name"
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
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter last name"
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
                <FormLabel>Birth Date</FormLabel>
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
                <FormLabel>Gender</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
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
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter street address"
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
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter city"
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
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter postal code"
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
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter country"
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
              <FormLabel>Relationship</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="CHILD">Child</SelectItem>
                  <SelectItem value="PARTNER">Partner</SelectItem>
                  <SelectItem value="GUARDIAN">Guardian</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create Member"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
