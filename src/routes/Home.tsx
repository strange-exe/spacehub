import { ApodDayView } from "@/features/apod/components/ApodDayView";
import { useLatestApodDate } from "@/features/apod/hooks/useLatestApodDate";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function Home() {
  useDocumentTitle("Today");
  // Reactive, so a tab left open across midnight US Eastern moves on to the new plate.
  return <ApodDayView date={useLatestApodDate()} />;
}
