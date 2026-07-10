import { Avatar, AvatarFallback } from "../ui/avatar";

export const getUserInitial = (name) =>
  (name?.trim()?.charAt(0) || "U").toUpperCase();

const UserAvatar = ({
  name,
  className = "",
  fallbackClassName = "bg-[#f3edff] font-bold text-[#6A38C2]",
}) => (
  <Avatar className={className}>
    <AvatarFallback className={fallbackClassName}>{getUserInitial(name)}</AvatarFallback>
  </Avatar>
);

export default UserAvatar;
