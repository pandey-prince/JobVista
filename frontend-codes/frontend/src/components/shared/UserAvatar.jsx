import { Avatar, AvatarFallback } from "../ui/avatar";

export const getUserInitial = (name) =>
  (name?.trim()?.charAt(0) || "U").toUpperCase();

const UserAvatar = ({
  name,
  className = "",
  fallbackClassName = "bg-brand-muted font-bold text-brand",
}) => (
  <Avatar className={className}>
    <AvatarFallback className={fallbackClassName}>{getUserInitial(name)}</AvatarFallback>
  </Avatar>
);

export default UserAvatar;
