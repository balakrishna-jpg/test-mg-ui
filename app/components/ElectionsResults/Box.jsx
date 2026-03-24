import React from 'react';

const Box = ({ result, selectedState }) => {
  return (
    <div
      className="flex items-center justify-evenly m-1"
      key={result?.party?.party_id}
    >
      <div className="flex-[2] flex mx-[8px] items-center justify-start text-center">
        <img
          src={result?.party?.party_flag_img || "https://static.aadhan.in/elections/others_11zon.jpg"}
          style={{ borderRadius: "50%", marginLeft: ".5rem" }}
          width={22}
          height={22}
          alt={result?.party?.display_name}
        />
        <div className="text-left text-[14px] font-[400] text-[#FFFFFF] ps-6">
          {result?.party?.display_name?.replace('+', ' + ')}
        </div>
      </div>
      <div className="flex-1 text-[14px] font-[500] mx-[2px] rounded-l-md py-1 bg-[#090F4D] text-[#FFFFFF] text-center">
        {result?.leading || 0}
      </div>
      <div className="flex-1 text-[14px] font-[500] mx-[2px] py-1 bg-[#090F4D] text-[#FFFFFF] text-center">
        {result?.won || 0}
      </div>
      <div className="flex-1 text-[14px] font-[500] mx-[2px] py-1 rounded-r-md bg-[#090F4D] text-[#FFFFFF] text-center">
        {result?.total || 0}
      </div>
    </div>
  );
};

export default Box;
