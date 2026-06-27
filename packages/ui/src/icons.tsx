/**
 * Central icon registry for the Trinserhof apps.
 *
 * All icons used across the apps are imported from `lucide-react` *once*, here,
 * and re-exported under semantic, app-specific names. Nothing outside this file
 * should import from `lucide-react` directly — import the icon you need from
 * `@trinserhof/ui` instead. This keeps the icon set consistent and makes it
 * trivial to swap the underlying icon (or icon library) in a single place.
 *
 * Below the individual icons, `PAGE_ICONS`, `BOOKING_ICONS`,
 * `ROOM_AMENITY_ICONS` and `ROOM_BED_COUNT_ICONS` declare which icon belongs to
 * which section/page of the app, so that decision lives in code in one spot.
 */
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Baby,
  BadgeEuro,
  Bath,
  BedDouble,
  BedSingle,
  BookMarked,
  Calendar,
  CalendarDays,
  CalendarSearch,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleUserRound,
  ConciergeBell,
  Dog,
  DoorOpen,
  Eye,
  FileText,
  House,
  LayoutTemplate,
  Loader2,
  LogIn,
  LogOut,
  Map,
  Menu,
  Merge,
  Minus,
  Moon,
  Mountain,
  Pencil,
  Phone,
  Plus,
  Receipt,
  RefreshCw,
  RotateCcw,
  ScrollText,
  Search,
  ShowerHead,
  Sofa,
  Square,
  SplitSquareHorizontal,
  Sun,
  Table2,
  Toilet,
  Trash2,
  Tv,
  User,
  Users,
  Utensils,
  X,
  type LucideIcon,
} from 'lucide-react';

export type { LucideIcon };

/** A component that renders an icon. */
export type IconComponent = LucideIcon;

/* -------------------------------------------------------------------------- */
/*  Generic actions                                                           */
/* -------------------------------------------------------------------------- */

export const PlusIcon = Plus;
export const MinusIcon = Minus;
/** Generic "close / dismiss / remove" cross. */
export const CloseIcon = X;
export const Cross2Icon = X;
export const XIcon = X;
export const CheckIcon = Check;
export const SearchIcon = Search;
export const MagnifyingGlassIcon = Search;
export const EyeIcon = Eye;
export const ResetIcon = RotateCcw;
export const UpdateIcon = RefreshCw;
export const TrashIcon = Trash2;
export const EditIcon = Pencil;
export const PencilIcon = Pencil;
export const Pencil1Icon = Pencil;
export const SpinnerIcon = Loader2;
export const MenuIcon = Menu;
export const SunIcon = Sun;
export const MoonIcon = Moon;
export const MapIcon = Map;
export const MergeIcon = Merge;
export const SplitIcon = SplitSquareHorizontal;

/* -------------------------------------------------------------------------- */
/*  Chevrons / sorting                                                        */
/* -------------------------------------------------------------------------- */

export const ChevronDownIcon = ChevronDown;
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRightIcon = ChevronRight;
export const CaretSortIcon = ChevronsUpDown;
export const ArrowUpIcon = ArrowUp;
export const ArrowDownIcon = ArrowDown;
export const ArrowLeftIcon = ArrowLeft;

/* -------------------------------------------------------------------------- */
/*  People / guests                                                           */
/* -------------------------------------------------------------------------- */

export const PersonIcon = User;
export const UserIcon = User;
export const AdultIcon = User;
export const ChildIcon = Baby;
export const PetIcon = Dog;
export const UsersIcon = Users;
export const AvatarIcon = CircleUserRound;

/* -------------------------------------------------------------------------- */
/*  Calendar / dates                                                          */
/* -------------------------------------------------------------------------- */

export const CalendarIcon = Calendar;
export const CalendarDaysIcon = CalendarDays;
export const CalendarSearchIcon = CalendarSearch;

/* -------------------------------------------------------------------------- */
/*  Sections & pages                                                          */
/* -------------------------------------------------------------------------- */

export const DashboardIcon = ConciergeBell;
export const BedIcon = BedDouble;
export const HomeIcon = House;
export const StayingIcon = House;
export const UtensilsIcon = Utensils;
export const ArrivalIcon = LogIn;
export const DepartureIcon = LogOut;
export const PriceIcon = BadgeEuro;
export const ArchiveIcon = Archive;
export const BookMarkedIcon = BookMarked;
export const LayoutTemplateIcon = LayoutTemplate;
export const ActivityLogIcon = ScrollText;
export const FileTextIcon = FileText;
export const ReceiptIcon = Receipt;
export const InvoiceIcon = Receipt;

/* -------------------------------------------------------------------------- */
/*  Room features (amenities & beds)                                          */
/* -------------------------------------------------------------------------- */

export const BathtubIcon = Bath;
export const KingBedIcon = BedDouble;
export const QueenBedIcon = BedDouble;
export const SingleBedIcon = BedSingle;
export const BalconyIcon = DoorOpen;
export const SpacesIcon = Square;
export const MountainViewIcon = Mountain;
export const PhoneIcon = Phone;
export const ShowerIcon = ShowerHead;
export const SleepSofaIcon = Sofa;
export const DeskIcon = Table2;
export const ToiletIcon = Toilet;
export const TvIcon = Tv;

/* -------------------------------------------------------------------------- */
/*  Section / page registry                                                   */
/*                                                                            */
/*  Declares which icon represents which page of the PMS, so navigation and   */
/*  shortcuts can reference a single source of truth instead of each picking   */
/*  their own icon.                                                            */
/* -------------------------------------------------------------------------- */

export const PAGE_ICONS = {
  dashboard: DashboardIcon,
  calendar: CalendarDaysIcon,
  bookings: BedIcon,
  tableReservations: UtensilsIcon,
  customers: PersonIcon,
  invoices: InvoiceIcon,
  rooms: HomeIcon,
  tables: LayoutTemplateIcon,
  prices: PriceIcon,
  products: ArchiveIcon,
  accountingCategories: BookMarkedIcon,
  auditLog: ActivityLogIcon,
  users: AvatarIcon,
  migration: UpdateIcon,
  rawData: FileTextIcon,
} satisfies Record<string, IconComponent>;

/** Icons for the per-guest counts shown on a booking (adults / children / pets). */
export const BOOKING_ICONS = {
  bed: BedIcon,
  adult: AdultIcon,
  child: ChildIcon,
  pet: PetIcon,
  guests: UsersIcon,
} satisfies Record<string, IconComponent>;
