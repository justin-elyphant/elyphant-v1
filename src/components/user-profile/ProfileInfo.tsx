
import React from "react";
import { Users, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { CalendarDays, MapPin, Info } from "lucide-react";
import { format } from "date-fns";
import { isDataVisible } from "@/utils/privacyUtils";
import { ConnectionStatus } from "@/hooks/useConnectionStatus";

interface ProfileInfoProps {
  userData: any;
}

const ProfileInfo = ({ userData }: ProfileInfoProps) => {
  // For demo purposes, we'll use 'accepted' as the connection status
  // This would normally come from useConnectionStatus hook in a real implementation
  const connectionStatus: ConnectionStatus = 'accepted';
  
  // Handle possible undefined values safely
  const name = userData?.name || "User";
  const username = userData?.username || "username";
  const bio = userData?.bio;
  const dataSharingSettings = userData?.data_sharing_settings || {};
  
  // Check birthday visibility using our utility function
  const birthdayVisible = isDataVisible(
    userData?.birthday || userData?.dob,
    dataSharingSettings.dob || "friends",
    connectionStatus
  );
  
  // Check location visibility
  const locationVisible = isDataVisible(
    (userData?.address?.city && userData?.address?.country) ? true : userData?.shipping_address,
    dataSharingSettings.shipping_address || "private",
    connectionStatus
  );
  
  // Check email visibility
  const emailVisible = isDataVisible(
    userData?.email,
    dataSharingSettings.email || "private",
    connectionStatus
  );

  return (
    <div className="pl-4 sm:pl-8 mb-8 pt-14 sm:pt-4">
      <h1 className="text-xl sm:text-2xl font-bold">{name}</h1>
      <div className="text-sm text-muted-foreground mb-2">@{username}</div>
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
      
      {bio ? (
        <p className="mt-4 text-muted-foreground">{bio}</p>
      ) : (
        <p className="mt-4 text-muted-foreground">
          {userData?.profileType === "gifter" 
            ? "I love finding the perfect gifts for my friends and family!" 
            : userData?.profileType === "giftee"
            ? "Check out my wishlists for gift ideas!"
            : "I enjoy both giving and receiving gifts!"}
        </p>
      )}
      
      {/* Personal Info Card */}
      {(birthdayVisible || locationVisible || emailVisible) && (
        <Card className="mt-4 w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {birthdayVisible && userData?.birthday && (
                  <TableRow>
                    <TableCell className="font-medium flex items-center">
                      <CalendarDays className="h-4 w-4 mr-2" />
                      Birthday
                    </TableCell>
                    <TableCell>
                      {format(new Date(userData.birthday || userData.dob), "MMMM d")}
                    </TableCell>
                  </TableRow>
                )}
                {locationVisible && (
                  <TableRow>
                    <TableCell className="font-medium flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Location
                    </TableCell>
                    <TableCell>
                      {userData.address ? 
                        `${userData.address.city}, ${userData.address.country}` : 
                        userData.shipping_address ? 
                          `${userData.shipping_address.city}, ${userData.shipping_address.country}` : 
                          "Location not specified"}
                    </TableCell>
                  </TableRow>
                )}
                {emailVisible && userData?.email && (
                  <TableRow>
                    <TableCell className="font-medium flex items-center">
                      <Info className="h-4 w-4 mr-2" />
                      Email
                    </TableCell>
                    <TableCell>
                      {userData.email}
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
