import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { GetCalendarDataResponse, DailyCompletion } from "@shared/api";
import { cn } from "@/lib/utils";

export default function Calendar() {
  const [calendarData, setCalendarData] = useState<
    Record<string, DailyCompletion[]>
  >({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      const response = await fetch("/api/calendar");
      const data = (await response.json()) as GetCalendarDataResponse;
      setCalendarData(data.completions);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getCompletionsForDate = (date: Date) => {
    const dateString = formatDate(date);
    return calendarData[dateString] || [];
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const selectedDateCompletions = selectedDate
    ? calendarData[selectedDate] || []
    : [];

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const today = new Date();
  const todayString = formatDate(today);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Calendario</h1>
            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Calendar Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("prev")}
                className="text-white hover:bg-white/20 p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <CardTitle className="text-center flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth("next")}
                className="text-white hover:bg-white/20 p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentDate).map((date, index) => {
                if (!date) {
                  return <div key={index} className="h-12" />;
                }

                const dateString = formatDate(date);
                const completions = getCompletionsForDate(date);
                const isToday = dateString === todayString;
                const isSelected = dateString === selectedDate;
                const hasCompletions = completions.length > 0;

                return (
                  <button
                    key={index}
                    onClick={() =>
                      setSelectedDate(isSelected ? null : dateString)
                    }
                    className={cn(
                      "h-12 flex flex-col items-center justify-center text-sm border border-gray-200 rounded-lg transition-all",
                      isToday &&
                        "border-blue-500 bg-blue-50 text-blue-700 font-semibold",
                      isSelected && "bg-purple-100 border-purple-300",
                      hasCompletions &&
                        !isToday &&
                        !isSelected &&
                        "bg-green-50 border-green-200",
                      !hasCompletions &&
                        !isToday &&
                        !isSelected &&
                        "hover:bg-gray-50",
                    )}
                  >
                    <span>{date.getDate()}</span>
                    {hasCompletions && (
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        {selectedDate && (
          <Card className="shadow-md border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "es-ES",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    },
                  )}
                </span>
                <Badge variant="secondary">
                  {selectedDateCompletions.length} completada
                  {selectedDateCompletions.length !== 1 ? "s" : ""}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {selectedDateCompletions.length > 0 ? (
                <div className="space-y-3">
                  {selectedDateCompletions.map((completion) => (
                    <div
                      key={completion.id}
                      className="bg-green-50 border border-green-200 rounded-lg p-3"
                    >
                      <h4 className="font-medium text-green-900 mb-1">
                        {completion.idea.text}
                      </h4>
                      {completion.idea.description && (
                        <p className="text-sm text-green-700">
                          {completion.idea.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className="text-xs border-green-300 text-green-700"
                        >
                          ✓ Completada
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">
                    No hay ideas completadas en esta fecha
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">
              📊 Resumen del Mes
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {
                    Object.keys(calendarData).filter((date) => {
                      const d = new Date(date);
                      return (
                        d.getMonth() === currentDate.getMonth() &&
                        d.getFullYear() === currentDate.getFullYear()
                      );
                    }).length
                  }
                </div>
                <div className="text-sm text-gray-600">Días Activos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.entries(calendarData).reduce(
                    (total, [date, completions]) => {
                      const d = new Date(date);
                      if (
                        d.getMonth() === currentDate.getMonth() &&
                        d.getFullYear() === currentDate.getFullYear()
                      ) {
                        return total + completions.length;
                      }
                      return total;
                    },
                    0,
                  )}
                </div>
                <div className="text-sm text-gray-600">Ideas Completadas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="flex items-center gap-2 justify-center"
          >
            Hoy
          </Button>
          <Button
            onClick={() => navigate("/ideas")}
            variant="outline"
            className="flex items-center gap-2 justify-center"
          >
            Ver Ideas
          </Button>
        </div>
      </div>
    </div>
  );
}
