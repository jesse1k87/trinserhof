import React from 'react';
import { type LucideProps } from 'lucide-react';

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
  Building2,
  CalendarDays,
  CalendarSearch,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  ConciergeBell,
  Dog,
  DoorOpen,
  Eye,
  Grid3x3,
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
  RotateCcw,
  ScrollText,
  Search,
  ShieldCheck,
  ShieldX,
  ShowerHead,
  Sofa,
  LogOut as SignOut,
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
} from 'lucide-react';

import { BookingStatus } from '@trinserhof/types';

const icon = (IconComponent: React.ElementType) => {
  return (props: LucideProps) => {
    const hasSizeClass = props.className?.includes('size-');
    const defaultClass = hasSizeClass ? '' : 'size-4';
    return (
      <IconComponent {...props} className={`${defaultClass} ${props.className || ''}`.trim()} />
    );
  };
};

export const AccountingCategoryIcon = icon(BookMarked);
export const AddIcon = icon(Plus);
export const AdultIcon = icon(User);
export const ArrowDownIcon = icon(ArrowDown);
export const ArrowLeftIcon = icon(ArrowLeft);
export const ArrowUpIcon = icon(ArrowUp);
export const AuditLogIcon = icon(ScrollText);
export const BalconyIcon = icon(Sun);
export const BathIcon = icon(Bath);
export const BedIcon = icon(BedDouble);
export const BedKingIcon = icon(BedDouble);
export const BedQueenIcon = icon(BedDouble);
export const BedSingleIcon = icon(BedSingle);
export const BookingIcon = icon(BedDouble);
export const CalendarIcon = icon(CalendarDays);
export const CalendarSearchIcon = icon(CalendarSearch);
export const CheckIcon = icon(Check);
export const CheckInIcon = icon(LogIn);
export const CheckOutIcon = icon(LogOut);
export const ChevronDownIcon = icon(ChevronDown);
export const ChevronLeftIcon = icon(ChevronLeft);
export const ChevronRightIcon = icon(ChevronRight);
export const ChildIcon = icon(Baby);
export const CloseIcon = icon(X);
export const DashboardIcon = icon(ConciergeBell);
export const DecreaseIcon = icon(Minus);
export const DeleteIcon = icon(Trash2);
export const DeskIcon = icon(Table2);
export const EditIcon = icon(Pencil);
export const GuestIcon = icon(User);
export const HomeIcon = icon(House);
export const InvoiceIcon = icon(Receipt);
export const LoadingIcon = icon(Loader2);
export const MapIcon = icon(Map);
export const MenuIcon = icon(Menu);
export const MergeIcon = icon(Merge);
export const MissingIcon = icon(SplitSquareHorizontal);
export const MountainIcon = icon(Mountain);
export const OccupancyPricingIcon = icon(Grid3x3);
export const NoAccessIcon = icon(ShieldX);
export const PetIcon = icon(Dog);
export const PhoneIcon = icon(Phone);
export const PriceIcon = icon(BadgeEuro);
export const ProductIcon = icon(Archive);
export const PropertyIcon = icon(Building2);
export const ResetIcon = icon(RotateCcw);
export const RoleIcon = icon(ShieldCheck);
export const RoomIcon = icon(DoorOpen);
export const RoomTypeIcon = icon(BedDouble);
export const SearchIcon = icon(Search);
export const ShowerIcon = icon(ShowerHead);
export const SignOutIcon = icon(SignOut);
export const SofaIcon = icon(Sofa);
export const SortIcon = icon(ChevronsUpDown);
export const SpaceIcon = icon(Square);
export const StayIcon = icon(House);
export const TableIcon = icon(LayoutTemplate);
export const TableBookingIcon = icon(Utensils);
export const ThemeDarkIcon = icon(Moon);
export const ThemeLightIcon = icon(Sun);
export const ToiletIcon = icon(Toilet);
export const TvIcon = icon(Tv);
export const UserIcon = icon(User);
export const UsersIcon = icon(Users);
export const ViewIcon = icon(Eye);
export const WipeDataIcon = icon(Trash2);

export const PendingIcon = icon(Clock);
export const ConfirmedIcon = icon(ThumbsUp);
export const CheckedInIcon = icon(Check);
export const CheckedOutIcon = icon(Check);
export const CancelledIcon = icon(X);

export const BOOKING_STATUS_ICONS: Record<BookingStatus, ReturnType<typeof icon>> = {
  PENDING: PendingIcon,
  CONFIRMED: ConfirmedIcon,
  CHECKED_IN: CheckedInIcon,
  CHECKED_OUT: CheckedOutIcon,
  CANCELLED: CancelledIcon,
};
