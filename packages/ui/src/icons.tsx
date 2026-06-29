import { BookingStatus } from '@trinserhof/types';
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
  CalendarDays,
  CalendarSearch,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  CircleUserRound,
  Clock,
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
  ShieldCheck,
  ShieldX,
  ShowerHead,
  Sofa,
  SplitSquareHorizontal,
  Square,
  Sun,
  Table2,
  ThumbsUp,
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

export type IconComponent = LucideIcon;

export const PlusIcon = Plus;
export const MinusIcon = Minus;
export const CloseIcon = X;
export const Cross2Icon = X;
export const XIcon = X;
export const CheckIcon = Check;
export const SearchIcon = Search;
export const MagnifyingGlassIcon = Search;
export const EyeIcon = Eye;
export const ResetIcon = RotateCcw;
export const NoAccessIcon = ShieldX;
export const RoleIcon = ShieldCheck;
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

export const ChevronDownIcon = ChevronDown;
export const ChevronLeftIcon = ChevronLeft;
export const ChevronRightIcon = ChevronRight;
export const CaretSortIcon = ChevronsUpDown;
export const ArrowUpIcon = ArrowUp;
export const ArrowDownIcon = ArrowDown;
export const ArrowLeftIcon = ArrowLeft;

export const PersonIcon = User;
export const UserIcon = User;
export const AdultIcon = User;
export const ChildIcon = Baby;
export const PetIcon = Dog;
export const UsersIcon = Users;
export const AvatarIcon = CircleUserRound;

export const CalendarIcon = CalendarDays;
export const CalendarSearchIcon = CalendarSearch;

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

export const PAGE_ICONS = {
  dashboard: DashboardIcon,
  calendar: CalendarIcon,
  bookings: BedIcon,
  restaurantReservations: UtensilsIcon,
  customers: PersonIcon,
  invoices: InvoiceIcon,
  rooms: HomeIcon,
  roomTypes: BedIcon,
  tables: LayoutTemplateIcon,
  prices: PriceIcon,
  products: ArchiveIcon,
  accountingCategories: BookMarkedIcon,
  auditLog: ActivityLogIcon,
  users: AvatarIcon,
  roles: RoleIcon,
} satisfies Record<string, IconComponent>;

export const BOOKING_ICONS = {
  bed: BedIcon,
  adult: AdultIcon,
  child: ChildIcon,
  pet: PetIcon,
  guests: UsersIcon,
} satisfies Record<string, IconComponent>;

export const BOOKING_STATUS_ICONS: Record<BookingStatus, IconComponent> = {
  PENDING: Clock,
  CONFIRMED: ThumbsUp,
  CHECKED_IN: LogIn,
  CHECKED_OUT: LogOut,
  CANCELLED: X,
};
