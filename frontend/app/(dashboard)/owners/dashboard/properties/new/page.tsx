import type { Metadata } from "next";
import NewPropertyForm from "./NewPropertyForm";

export const metadata: Metadata = {
  title: "Add New Property",
  robots: { index: false, follow: false },
};

export default function NewPropertyPage() {
  return <NewPropertyForm />;
}
