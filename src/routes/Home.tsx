import { ApodDayView } from "@/features/apod/components/ApodDayView";
import { latestApodDate } from "@/features/apod/lib/apodDates";
import { useDocumentTitle } from "@/lib/useDocumentTitle";

export default function Home() {
  useDocumentTitle("Today");
  return <ApodDayView date={latestApodDate()} />;
}
