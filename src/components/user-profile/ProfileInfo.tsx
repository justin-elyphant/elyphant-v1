
import React from "react";
import { Users, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { CalendarDays, MapPin } from "lucide-react";
import { format } from "date-fns";

interface ProfileInfoProps {
  userData: any;
}

const ProfileInfo = ({ userData }: ProfileInfoProps) => {
  return (
    <div className="pl-4 sm:pl-8 mb-8 pt-14 sm:pt-4">
      <h1 className="text-xl sm:text-2xl font-bold">{userData?.name || "User Name"}</h1>
      <div className="text-sm text-muted-foreground mb-2">@{userData?.username || "username"}</div>
      <div className="flex items-center gap-3 sm:gap-6 mt-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
        <div className="flex items-center">
          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="font-medium">127</span> Followers
        </div>
        <div className="flex items-center">
          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="font-medium">83</span> Following
        </div>
        <div className="flex items-center">
          <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          <span className="font-medium">254</span> Likes
        </div>
      </div>
      {userData?.bio && (
        <p className="mt-4 text-muted-foreground">{userData.bio}</p>
      )}
      {!userData?.bio && (
        <p className="mt-4 text-muted-foreground">
          {userData?.profileType === "gifter" 
            ? "I love finding the perfect gifts for my friends and family!" 
            : userData?.profileType === "giftee"
            ? "Check out my wishlists for gift ideas!"
            : "I enjoy both giving and receiving gifts!"}
        </p>
      )}
      
      {/* Personal Info Card */}
      {(userData?.birthday || (userData?.address?.city && userData?.address?.country)) && (
        <Card className="mt-4 w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {userData?.birthday && (
                  <TableRow>
                    <TableCell className="font-medium flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Birthday
                    </TableCell>
                    <TableCell>
                      {format(new Date(userData.birthday), "MMMM d")}
                    </TableCell>
                  </TableRow>
                )}
                {userData?.address?.city && userData?.address?.country && (
                  <TableRow>
                    <TableCell className="font-medium flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Location
                    </TableCell>
                    <TableCell>
                      {userData.address.city}, {userData.address.country}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileInfo;
