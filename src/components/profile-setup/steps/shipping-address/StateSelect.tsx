
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StateSelectProps {
  value: string;
  onChange: (state: string) => void;
}

const StateSelect: React.FC<StateSelectProps> = ({ value, onChange }) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select state" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="AL">Alabama</SelectItem>
        <SelectItem value="AK">Alaska</SelectItem>
        <SelectItem value="AZ">Arizona</SelectItem>
        <SelectItem value="AR">Arkansas</SelectItem>
        <SelectItem value="CA">California</SelectItem>
        <SelectItem value="CO">Colorado</SelectItem>
        <SelectItem value="CT">Connecticut</SelectItem>
        <SelectItem value="DE">Delaware</SelectItem>
        <SelectItem value="FL">Florida</SelectItem>
        <SelectItem value="GA">Georgia</SelectItem>
        <SelectItem value="HI">Hawaii</SelectItem>
        <SelectItem value="ID">Idaho</SelectItem>
        <SelectItem value="IL">Illinois</SelectItem>
        <SelectItem value="IN">Indiana</SelectItem>
        <SelectItem value="IA">Iowa</SelectItem>
        <SelectItem value="KS">Kansas</SelectItem>
        <SelectItem value="KY">Kentucky</SelectItem>
        <SelectItem value="LA">Louisiana</SelectItem>
        <SelectItem value="ME">Maine</SelectItem>
        <SelectItem value="MD">Maryland</SelectItem>
        <SelectItem value="MA">Massachusetts</SelectItem>
        <SelectItem value="MI">Michigan</SelectItem>
        <SelectItem value="MN">Minnesota</SelectItem>
        <SelectItem value="MS">Mississippi</SelectItem>
        <SelectItem value="MO">Missouri</SelectItem>
        <SelectItem value="MT">Montana</SelectItem>
        <SelectItem value="NE">Nebraska</SelectItem>
        <SelectItem value="NV">Nevada</SelectItem>
        <SelectItem value="NH">New Hampshire</SelectItem>
        <SelectItem value="NJ">New Jersey</SelectItem>
        <SelectItem value="NM">New Mexico</SelectItem>
        <SelectItem value="NY">New York</SelectItem>
        <SelectItem value="NC">North Carolina</SelectItem>
        <SelectItem value="ND">North Dakota</SelectItem>
        <SelectItem value="OH">Ohio</SelectItem>
        <SelectItem value="OK">Oklahoma</SelectItem>
        <SelectItem value="OR">Oregon</SelectItem>
        <SelectItem value="PA">Pennsylvania</SelectItem>
        <SelectItem value="RI">Rhode Island</SelectItem>
        <SelectItem value="SC">South Carolina</SelectItem>
        <SelectItem value="SD">South Dakota</SelectItem>
        <SelectItem value="TN">Tennessee</SelectItem>
        <SelectItem value="TX">Texas</SelectItem>
        <SelectItem value="UT">Utah</SelectItem>
        <SelectItem value="VT">Vermont</SelectItem>
        <SelectItem value="VA">Virginia</SelectItem>
        <SelectItem value="WA">Washington</SelectItem>
        <SelectItem value="WV">West Virginia</SelectItem>
        <SelectItem value="WI">Wisconsin</SelectItem>
        <SelectItem value="WY">Wyoming</SelectItem>
        <SelectItem value="DC">District of Columbia</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default StateSelect;
