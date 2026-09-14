// Allows us to see <canvas id="myCanvas"> in the HTML and use it in our JS!
const canvasObject = document.getElementById("myChart");

// This is our data, you can see two keys, year and data, per entry.
const myData = [
  { year: 1994, data: 1931861 },
  { year: 1995, data: 1927074 },
  { year: 1996, data: 1921828 },
  { year: 1997, data: 1915792 },
  { year: 1998, data: 1908096 },
  { year: 1999, data: 1899053 },
  { year: 2000, data: 1891561 },
  { year: 2001, data: 1887857 },
  { year: 2002, data: 1888583 },
  { year: 2003, data: 1888102 },
  { year: 2004, data: 1888061 },
  { year: 2005, data: 1893339 },
  { year: 2006, data: 1897218 },
  { year: 2007, data: 1905377 },
  { year: 2008, data: 1910803 },
  { year: 2009, data: 1916438 },
  { year: 2010, data: 1926115 },
  { year: 2011, data: 1933413 },
  { year: 2012, data: 1934811 },
  { year: 2013, data: 1937894 },
  { year: 2014, data: 1943050 },
  { year: 2015, data: 1942929 },
  { year: 2016, data: 1947330 },
  { year: 2017, data: 1951097 },
  { year: 2018, data: 1955852 },
  { year: 2019, data: 1962050 },
  { year: 2020, data: 1962979 },
  { year: 2021, data: 1969128 },
  { year: 2022, data: 1993639 },
  { year: 2023, data: 2022416 },
  { year: 2024, data: 2047820 }
];

const myChart = new Chart(canvasObject, {
  // Creates a chart object on our canvas
  type: "bar", // Type of chart
  data: {
    labels: myData.map((e) => e.year), // gets the year from the object above
    datasets: [
      {
        label: "# Of people living in the North East", // Label for this dataset
        data: myData.map((e) => e.data), // gets the data from the object above
        backgroundColor: "#52c426ff", // Colour of the dots
        borderColor: "#17181aff" // Colour of the lines
      }
    ]
  },
  options: {
    reponsive: true
  }
});
