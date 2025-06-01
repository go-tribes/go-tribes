import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import MainLayout from "../components/MainLayout";
import { FaTrash, FaRandom } from "react-icons/fa";
import { auth } from "../firebase";

// --- Helper to extract clean city name (first two words)
function extractCity(term: string) {
  if (!term) return "";
  // e.g. "Kuala Lumpur, Federal Territory of Kuala Lumpur, Malaysia" => "Kuala Lumpur"
  const firstComma = term.indexOf(",");
  const main = firstComma !== -1 ? term.slice(0, firstComma) : term;
  const parts = main.trim().split(" ").filter(Boolean);
  return parts.length > 1 ? parts.slice(0, 2).join(" ") : parts[0];
}

const BASE_CURRENCY = "USD";
const supportedCurrencies = ["MYR", "USD", "GBP", "EUR", "JPY", "THB", "AUD", "SGD", "KRW", "CNY"];
const GOOGLE_LIBRARIES: ("places")[] = ["places"];

const mealEstimates = [
  { type: "Budget Meal", price: 10 },
  { type: "Mid-range", price: 30 },
  { type: "Fine Dining", price: 80 },
];

const smartSuggestionsPool = [
  "Take a free city walking tour to discover hidden gems.",
  "Visit a traditional local market and try a street food breakfast.",
  "Plan a sunrise hike or morning run at a scenic viewpoint.",
  "Spend an evening at a rooftop bar or café with a view.",
  "Join a group cooking class to learn the local cuisine.",
  "Book tickets for a cultural show or live performance.",
  "Explore a popular art museum or gallery.",
  "Try a famous local dessert spot or bakery.",
  "Rent a bicycle and tour the city like a local.",
  "Plan a day trip to a nearby town or nature reserve.",
];

function getDefaultCurrency(countryCode: string) {
  switch (countryCode) {
    case "MY": return "MYR";
    case "US": return "USD";
    case "GB": return "GBP";
    case "JP": return "JPY";
    case "TH": return "THB";
    case "AU": return "AUD";
    case "SG": return "SGD";
    case "KR": return "KRW";
    case "CN": return "CNY";
    case "ID": return "IDR";
    default: return "USD";
  }
}

type Destination = {
  place: string;
  placeId?: string;
  autocomplete?: any;
  start: string;
  end: string;
};

export default function PlanTrip() {
  const router = useRouter();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: GOOGLE_LIBRARIES,
  });

  const today = new Date().toISOString().split("T")[0];

  const [from, setFrom] = useState("");
  const [autocompleteFrom, setAutocompleteFrom] = useState<any>(null);

  const [destinations, setDestinations] = useState<Destination[]>([
    { place: "", start: "", end: "" }
  ]);

  const [userCountry, setUserCountry] = useState("MY");
  const [localCurrency, setLocalCurrency] = useState("MYR");
  const [rates, setRates] = useState<{ [key: string]: number }>({ MYR: 1 });
  const [ratesReady, setRatesReady] = useState(false);

  const [itinerary, setItinerary] = useState<{ activities: any[], destIdx: number }[]>([]);
  const [activeDay, setActiveDay] = useState(0);

  // ---- Transport state
  const [transportEstimates, setTransportEstimates] = useState<any[]>([]);
  const [transportLoading, setTransportLoading] = useState(false);

  const [hotels, setHotels] = useState<any[]>([]);
  const [hotelModalOpen, setHotelModalOpen] = useState(false);
  const [hotelModalDay, setHotelModalDay] = useState<number | null>(null);
  const [hotelName, setHotelName] = useState('');
  const [hotelAddr, setHotelAddr] = useState('');
  const [hotelCurrency, setHotelCurrency] = useState(localCurrency);
  const [hotelPrice, setHotelPrice] = useState('');
  const [hotelNights, setHotelNights] = useState(1);

  const [hotelAddressAuto, setHotelAddressAuto] = useState<any>(null);
  const handleHotelAddressLoad = (auto: any) => setHotelAddressAuto(auto);
  const handleHotelAddressChanged = () => {
    if (hotelAddressAuto) {
      const place = hotelAddressAuto.getPlace();
      setHotelAddr(place.formatted_address || place.name || "");
    }
  };

  const [activitySearch, setActivitySearch] = useState("");
  const [activityAutocomplete, setActivityAutocomplete] = useState<any>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let guessedCountry = navigator.language?.split("-")[1]?.toUpperCase() || "MY";
    fetch("https://ipapi.co/json")
      .then(res => res.json())
      .then(data => {
        if (data && data.country && typeof data.country === "string") {
          guessedCountry = data.country;
        }
        setUserCountry(guessedCountry);
        setLocalCurrency(getDefaultCurrency(guessedCountry));
        setHotelCurrency(getDefaultCurrency(guessedCountry));
      });
  }, []);

  useEffect(() => {
    setRatesReady(false);
    fetch("/api/rates")
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setRates(data.rates);
          setRatesReady(true);
        }
      }).catch(() => setRatesReady(false));
  }, []);

  const handleFromLoad = (auto: any) => setAutocompleteFrom(auto);
  const handleFromChanged = () => {
    if (autocompleteFrom) setFrom(autocompleteFrom.getPlace().formatted_address || autocompleteFrom.getPlace().name);
  };

  const handleDestLoad = (idx: number, auto: any) => {
    setDestinations(prev => {
      const arr = [...prev];
      arr[idx].autocomplete = auto;
      return arr;
    });
  };
  const handleDestChanged = (idx: number) => {
    setDestinations(prev => {
      const arr = [...prev];
      if (arr[idx].autocomplete) {
        const place = arr[idx].autocomplete.getPlace();
        arr[idx].place = place.formatted_address || place.name || "";
        arr[idx].placeId = place.place_id;
      }
      return arr;
    });
  };
  const handleDestInput = (idx: number, val: string) => {
    setDestinations(prev => {
      const arr = [...prev];
      arr[idx].place = val;
      return arr;
    });
  };
  const handleDestDate = (idx: number, field: "start" | "end", val: string) => {
    setDestinations(prev => {
      const arr = [...prev];
      arr[idx][field] = val;
      return arr;
    });
  };

  const addDestination = () => {
    setDestinations(prev => [...prev, { place: "", start: "", end: "" }]);
  };
  const removeDestination = (idx: number) => {
    setDestinations(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev);
  };

  useEffect(() => {
    let daysArr: { activities: any[]; destIdx: number }[] = [];
    let day = 0;
    destinations.forEach((dest, i) => {
      if (dest.place && dest.start && dest.end) {
        const fromD = new Date(dest.start);
        const toD = new Date(dest.end);
        let diff = Math.round((toD.getTime() - fromD.getTime()) / (1000 * 3600 * 24));
        if (diff < 0) diff = 0;
        for (let j = 0; j <= diff; j++) {
          daysArr.push({
            activities: itinerary[day]?.activities || [],
            destIdx: i,
          });
          day += 1;
        }
      }
    });
    setItinerary(daysArr);
    setActiveDay(0);
    // eslint-disable-next-line
  }, [destinations]);

  // --- FIX: Use only clean city for Amadeus lookup ---
  useEffect(() => {
    if (!from || destinations.length === 0) {
      setTransportEstimates([]);
      return;
    }
    const fetchTransport = async () => {
      setTransportLoading(true);
      let prev = extractCity(from);
      const arr = [];
      for (const dest of destinations) {
        if (!dest.place || !dest.start) continue;
        const travelDate = dest.start;
        const toCity = extractCity(dest.place);
        const res = await fetch(`/api/flightEstimate?from=${encodeURIComponent(prev)}&to=${encodeURIComponent(toCity)}&date=${travelDate}`);
        const data = await res.json();
        arr.push({
          from: prev,
          to: toCity,
          price: data.price ? Number(data.price) : null,
          currency: data.currency || "USD"
        });
        prev = toCity;
      }
      setTransportEstimates(arr);
      setTransportLoading(false);
    };
    fetchTransport();
    // eslint-disable-next-line
  }, [from, destinations]);

  useEffect(() => {
    if (hotelModalOpen && hotelModalDay !== null) {
      const hotel = hotels.find(h => h.days.includes(hotelModalDay));
      setHotelName(hotel?.name || "");
      setHotelAddr(hotel?.address || "");
      setHotelCurrency(hotel?.currency || localCurrency);
      setHotelPrice(hotel?.pricePerNight?.toString() || "");
      setHotelNights(hotel?.nights || 1);
    }
  }, [hotelModalOpen, hotelModalDay, hotels, localCurrency]);

  const [smartSuggestion, setSmartSuggestion] = useState("");
  useEffect(() => {
    pickRandomSuggestion();
  }, []);
  const pickRandomSuggestion = () => {
    const idx = Math.floor(Math.random() * smartSuggestionsPool.length);
    setSmartSuggestion(smartSuggestionsPool[idx]);
  };

  const addActivity = (day: number, activity: any) => {
    setItinerary((prev) =>
      prev.map((d, i) =>
        i === day ? { ...d, activities: [...d.activities, activity] } : d
      )
    );
  };
  const removeActivity = (day: number, idx: number) => {
    setItinerary((prev) =>
      prev.map((d, i) =>
        i === day
          ? { ...d, activities: d.activities.filter((_, aIdx) => aIdx !== idx) }
          : d
      )
    );
  };
  const handleActivityLoad = (auto: any) => setActivityAutocomplete(auto);
  const handleActivityChanged = (cb: (place: any) => void) => {
    if (activityAutocomplete) {
      const place = activityAutocomplete.getPlace();
      cb({
        name: place.name,
        address: place.formatted_address,
        place_id: place.place_id,
        url: place.url,
      });
      setActivitySearch("");
    }
  };

  function convertCurrency(amount: number, from: string, to: string) {
    if (!ratesReady) return null;
    const rateTo = rates[to];
    const rateFrom = rates[from];
    if (!rateTo || !rateFrom) return null;
    return amount * (rateTo / rateFrom);
  }

  const hotelTotal = !ratesReady
    ? 0
    : hotels.reduce((sum, h) => {
        const converted = convertCurrency(Number(h.pricePerNight) * h.nights, h.currency, localCurrency);
        return sum + (converted ?? 0);
      }, 0);

  const activitiesTotal = itinerary.reduce(
    (sum, d) => sum + d.activities.reduce((s, a) => s + (Number(a.price) || 0), 0),
    0
  );

  const transportTotalUSD = transportEstimates.reduce((sum, t) => sum + (t.price || 0), 0);
  const transportTotalLocal = ratesReady ? convertCurrency(transportTotalUSD, "USD", localCurrency) : null;

  const totalBudget = hotelTotal + activitiesTotal + (transportTotalLocal || 0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setAuthed(false);
        setCheckingAuth(false);
      } else {
        setAuthed(true);
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    if (!checkingAuth && !authed) {
      router.replace("/login");
    }
  }, [checkingAuth, authed, router]);

  if (checkingAuth || !authed) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F4] dark:bg-[#23211b]">
          <span className="text-gt-primary dark:text-gt-primary text-xl">
            {checkingAuth ? "Checking login..." : "Redirecting..."}
          </span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {hotelModalOpen && hotelModalDay !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-[#23211b] p-8 rounded-xl shadow-xl w-full max-w-md relative">
            <button onClick={() => setHotelModalOpen(false)}
              className="absolute top-2 right-3 text-2xl text-gray-400 hover:text-red-500 font-bold"
              aria-label="Close">&times;</button>
            <h3 className="font-bold mb-3 text-blue-800 dark:text-yellow-200">Assign Hotel</h3>
            {!ratesReady ? (
              <div className="text-center p-4">
                <span className="animate-pulse text-gt-primary font-semibold">Loading live currency rates...</span>
              </div>
            ) : (
              <form
                onSubmit={async e => {
                  e.preventDefault();
                  if (!hotelModalDay || !hotelName || !hotelAddr || !hotelPrice || !hotelNights) return;
                  const daysArr = Array.from({ length: Number(hotelNights) }, (_, idx) => Number(hotelModalDay) + idx)
                    .filter(d => d > 0 && d <= itinerary.length);
                  setHotels(prev => [
                    ...prev.filter(h => !h.days.some(d => daysArr.includes(d))),
                    {
                      name: hotelName,
                      address: hotelAddr,
                      pricePerNight: Number(hotelPrice),
                      currency: hotelCurrency,
                      nights: Number(hotelNights),
                      days: daysArr,
                    }
                  ]);
                  setHotelModalOpen(false);
                }}
              >
                <label className="block font-medium mb-1">Hotel Name</label>
                <input className="w-full p-2 mb-2 rounded border" value={hotelName} onChange={e => setHotelName(e.target.value)} />

                <label className="block font-medium mb-1">Hotel Address</label>
                {isLoaded && (
                  <Autocomplete
                    onLoad={handleHotelAddressLoad}
                    onPlaceChanged={handleHotelAddressChanged}
                  >
                    <input
                      className="w-full p-2 mb-2 rounded border"
                      placeholder="Enter hotel name or address"
                      value={hotelAddr}
                      onChange={e => setHotelAddr(e.target.value)}
                    />
                  </Autocomplete>
                )}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block font-medium mb-1">Price/Night</label>
                    <input type="number" min={0} className="w-full p-2 mb-2 rounded border" value={hotelPrice} onChange={e => setHotelPrice(e.target.value)} />
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Currency</label>
                    <select value={hotelCurrency} onChange={e => setHotelCurrency(e.target.value)} className="w-full p-2 mb-2 rounded border">
                      {supportedCurrencies.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block font-medium mb-1">Nights</label>
                    <input type="number" min={1} max={itinerary.length - (hotelModalDay || 1) + 1} className="w-full p-2 mb-2 rounded border" value={hotelNights} onChange={e => setHotelNights(Number(e.target.value))} />
                  </div>
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 mr-2 mt-4 font-semibold shadow w-full">Save</button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="min-h-screen w-full bg-[#F5F5F4] dark:bg-[#23211b] transition-colors flex flex-col items-center py-8 px-2">
        <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
          {/* Main Planner */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Header with From, Destinations */}
            <div className="bg-white dark:bg-[#23221f] p-6 rounded-xl shadow flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="font-medium text-sm mb-1 block text-gt-muted dark:text-gt-gray">From</label>
                  {isLoaded && (
                    <Autocomplete onLoad={handleFromLoad} onPlaceChanged={handleFromChanged}>
                      <input
                        type="text"
                        value={from}
                        onChange={e => setFrom(e.target.value)}
                        placeholder="Departure City or IATA Code"
                        className="w-full p-2 border border-gray-300 dark:border-[#444236] rounded bg-gt-gray dark:bg-[#23211b] text-gt-dark dark:text-gt-gray"
                      />
                    </Autocomplete>
                  )}
                </div>
              </div>
              <div>
                <label className="font-medium text-sm mb-1 block text-gt-muted dark:text-gt-gray">Destinations</label>
                {destinations.map((dest, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-2 items-center mb-3">
                    {isLoaded && (
                      <Autocomplete
                        onLoad={auto => handleDestLoad(idx, auto)}
                        onPlaceChanged={() => handleDestChanged(idx)}
                      >
                        <input
                          type="text"
                          value={dest.place}
                          onChange={e => handleDestInput(idx, e.target.value)}
                          placeholder={`Destination ${idx + 1} (City or IATA Code)`}
                          className="flex-1 p-2 border border-gray-300 dark:border-[#444236] rounded bg-gt-gray dark:bg-[#23211b] text-gt-dark dark:text-gt-gray"
                        />
                      </Autocomplete>
                    )}
                    <input
                      type="date"
                      value={dest.start}
                      min={today}
                      onChange={e => handleDestDate(idx, "start", e.target.value)}
                      placeholder="Start Date"
                      className="w-36 p-2 border border-gray-300 dark:border-[#444236] rounded bg-gt-gray dark:bg-[#23211b] text-gt-dark dark:text-gt-gray"
                    />
                    <input
                      type="date"
                      value={dest.end}
                      min={dest.start || today}
                      onChange={e => handleDestDate(idx, "end", e.target.value)}
                      placeholder="End Date"
                      className="w-36 p-2 border border-gray-300 dark:border-[#444236] rounded bg-gt-gray dark:bg-[#23211b] text-gt-dark dark:text-gt-gray"
                    />
                    {destinations.length > 1 && (
                      <button
                        type="button"
                        className="ml-2 text-red-500 text-lg"
                        onClick={() => removeDestination(idx)}
                        title="Remove destination"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-yellow-900/40 hover:bg-blue-200 dark:hover:bg-yellow-700 text-blue-800 dark:text-yellow-200 font-bold"
                  onClick={addDestination}
                >
                  + Add Destination
                </button>
              </div>
            </div>

            {/* Transport Budget Section */}
            <div className="bg-white dark:bg-[#23221f] p-6 rounded-xl shadow mb-4">
              <div className="font-semibold text-gt-primary dark:text-gt-primary mb-2">
                Estimated Transport (Flight) Cost:
              </div>
              {transportLoading ? (
                <span className="animate-pulse">Loading...</span>
              ) : (
                <ul className="text-sm text-gray-700 dark:text-gt-gray">
                  {transportEstimates.map((t, idx) =>
                    <li key={idx}>
                      {t.from} → {t.to}: {t.price ? `${t.currency} ${t.price}` : 'Unavailable'}
                    </li>
                  )}
                </ul>
              )}
              <div className="mt-2 text-blue-700 dark:text-yellow-300 font-bold">
                Total: USD {transportTotalUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                {ratesReady && (
                  <span className="text-gt-primary ml-4">
                    ≈ {localCurrency} {(transportTotalLocal || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>

            {/* Days as Tabs */}
            {itinerary.length > 0 && (
              <div className="flex items-end gap-2 mb-6 w-full overflow-x-auto">
                {itinerary.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveDay(i)}
                    className={`
                      px-6 py-2 rounded-t-2xl font-bold text-base transition
                      ${activeDay === i
                        ? "bg-gt-primary text-white shadow-lg"
                        : "bg-gt-gray dark:bg-[#23211b] text-gt-primary dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
                      }
                    `}
                    style={{
                      borderBottom: activeDay === i ? "2px solid #D9A531" : "2px solid transparent",
                      minWidth: 96,
                    }}
                  >
                    Day {i + 1} <span className="block text-xs">{destinations[d.destIdx]?.place}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Day's Details */}
            {itinerary.length > 0 && (
              <div className="bg-white dark:bg-[#23221f] p-6 rounded-xl shadow transition-colors">
                {/* Which destination is this? */}
                <div className="mb-2">
                  <span className="font-semibold text-lg text-blue-700 dark:text-yellow-300">
                    {destinations[itinerary[activeDay].destIdx]?.place || "Unknown Place"}
                  </span>
                </div>

                {/* HOTEL SECTION */}
                {(() => {
                  const hotel = hotels.find(h => h.days.includes(activeDay + 1));
                  return (
                    <div className="mb-6">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg text-blue-700 dark:text-yellow-300">
                          Hotel for Day {activeDay + 1}
                        </span>
                        <button
                          className="ml-2 text-xs px-2 py-1 rounded bg-blue-100 dark:bg-yellow-900/40 hover:bg-blue-200 dark:hover:bg-yellow-700 transition"
                          onClick={() => {
                            setHotelModalDay(activeDay + 1);
                            setHotelModalOpen(true);
                          }}
                        >
                          {hotel ? "Change Hotel" : "Add Hotel"}
                        </button>
                      </div>
                      {hotel ? (
                        <div className="bg-gradient-to-br from-blue-50 dark:from-yellow-900/40 to-blue-100 dark:to-yellow-800/40 p-4 rounded-xl mt-2 flex flex-col md:flex-row gap-4 items-center shadow">
                          <div>
                            <div className="font-bold text-lg">{hotel.name}</div>
                            <div className="text-xs text-gray-700 dark:text-gt-gray">{hotel.address}</div>
                            <div className="text-xs mt-1">
                              <span className="font-semibold text-blue-700 dark:text-yellow-300">
                                {hotel.currency} {hotel.pricePerNight}
                              </span>
                              {" "}× {hotel.nights} night(s)
                              <span className="ml-2">
                                =
                                <span className="font-bold text-blue-700 dark:text-yellow-300">
                                  {!ratesReady
                                    ? <span className="animate-pulse">...</span>
                                    : (
                                      convertCurrency(Number(hotel.pricePerNight) * hotel.nights, hotel.currency, localCurrency)?.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                    )
                                  } {localCurrency}
                                </span>
                                {hotel.currency !== localCurrency && (
                                  <span className="text-xs ml-2 text-gray-400">(Converted from {hotel.currency})</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gt-gray mt-2">No hotel assigned for this day.</div>
                      )}
                    </div>
                  );
                })()}

                {/* Activities section */}
                <div className="mb-2 font-semibold text-gt-primary dark:text-gt-primary">
                  Activities for Day {activeDay + 1}
                </div>
                <div className="space-y-2">
                  {itinerary[activeDay]?.activities.length === 0 && (
                    <p className="text-gray-500 dark:text-gt-gray text-sm">
                      No activities yet. Add your first!
                    </p>
                  )}
                  {itinerary[activeDay]?.activities.map((a, idx2) => (
                    <div
                      key={idx2}
                      className="flex items-center gap-3 bg-gt-gray dark:bg-[#23211b] p-2 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-gray-600 dark:text-gt-gray">{a.address}</div>
                        {a.price && (
                          <div className="text-xs text-gt-primary">{localCurrency} {a.price}</div>
                        )}
                      </div>
                      <button
                        className="p-1 text-red-600 hover:text-red-800"
                        onClick={() => removeActivity(activeDay, idx2)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
                {/* Add Activity inline */}
                <div className="flex flex-col sm:flex-row gap-2 mt-4">
                  {isLoaded && (
                    <Autocomplete onLoad={handleActivityLoad} onPlaceChanged={() =>
                      handleActivityChanged((place) => {
                        addActivity(activeDay, { ...place, price: "" });
                      })
                    }>
                      <input
                        type="text"
                        value={activitySearch}
                        onChange={e => setActivitySearch(e.target.value)}
                        placeholder="Search activity/place"
                        className="flex-1 p-2 border border-gray-300 dark:border-[#444236] rounded bg-gt-gray dark:bg-[#23211b] text-gt-dark dark:text-gt-gray"
                      />
                    </Autocomplete>
                  )}
                  <input
                    type="number"
                    min={0}
                    step={1}
                    placeholder={localCurrency}
                    className="w-24 p-2 border border-gray-300 dark:border-[#444236] rounded bg-gt-gray dark:bg-[#23211b] text-gt-dark dark:text-gt-gray"
                    onChange={e => {
                      const v = e.target.value;
                      setItinerary(prev => {
                        const prevAct = prev[activeDay]?.activities;
                        if (!prevAct?.length) return prev;
                        const newActs = [...prevAct];
                        newActs[newActs.length - 1] = {
                          ...newActs[newActs.length - 1],
                          price: v,
                        };
                        return prev.map((d, i) =>
                          i === activeDay ? { ...d, activities: newActs } : d
                        );
                      });
                    }}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  {mealEstimates.map((m) => (
                    <button
                      key={m.type}
                      className="text-xs px-2 py-1 rounded bg-gt-primary/20 dark:bg-yellow-900/20 text-gt-primary hover:bg-gt-primary/30"
                      onClick={() => {
                        addActivity(activeDay, {
                          name: m.type,
                          address: "Meal",
                          price: m.price,
                        });
                      }}
                    >
                      {m.type} ({localCurrency} {m.price})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Budget Section */}
            {itinerary.length > 0 && (
              <div className="bg-white dark:bg-[#23221f] p-6 rounded-xl shadow flex justify-between items-center">
                <div className="font-semibold text-gt-primary dark:text-gt-primary">
                  Estimated Total Budget:
                  <span className="ml-2 text-blue-700 dark:text-yellow-300">
                    {!ratesReady
                      ? <span className="animate-pulse">...</span>
                      : `${localCurrency} ${totalBudget.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                    }
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gt-gray">
                  <span className="font-semibold">Hotels:</span> {localCurrency} {hotelTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })} &nbsp; | &nbsp;
                  <span className="font-semibold">Transport:</span> {localCurrency} {(transportTotalLocal || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} &nbsp; | &nbsp;
                  <span className="font-semibold">Activities:</span> {localCurrency} {activitiesTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
            )}
          </div>
          {/* Smart Suggestion Sidebar */}
          <div className="w-full md:w-64 shrink-0 mt-8 md:mt-0">
            <div className="bg-gt-gray dark:bg-[#23211b] p-5 rounded-xl shadow sticky top-28 flex flex-col gap-3 items-start">
              <div className="font-bold text-lg mb-2 text-gt-primary dark:text-gt-primary">
                Smart Suggestion
              </div>
              <div className="text-base text-gt-dark dark:text-gt-gray min-h-16">
                {smartSuggestion}
              </div>
              <button
                className="flex items-center gap-2 text-xs px-3 py-1 rounded bg-blue-100 dark:bg-yellow-900/40 text-blue-800 dark:text-yellow-200 hover:bg-blue-200 dark:hover:bg-yellow-700 mt-2"
                onClick={pickRandomSuggestion}
              >
                <FaRandom /> New Suggestion
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
