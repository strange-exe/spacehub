import { Navigate, useParams } from "react-router";
import { ApodDayView } from "@/features/apod/components/ApodDayView";
import { checkApodDate } from "@/features/apod/lib/apodDates";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import NotFound from "./NotFound";

export default function ApodDay() {
  const { date } = useParams();
  const check = checkApodDate(date);
  useDocumentTitle(check.kind === "ok" ? check.date : "Plate not found");

  // Out-of-range dates snap to the nearest real plate instead of hitting the API with a 400.
  if (check.kind === "future") return <Navigate to="/" replace />;
  if (check.kind === "too-early") return <Navigate to={`/apod/${check.date}`} replace />;
  if (check.kind === "invalid") return <NotFound />;
  return <ApodDayView date={check.date} />;
}
