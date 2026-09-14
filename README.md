# enigma-int-wex

Front-end tasks from a work experience placement at Enigma Interactive: two standalone projects, each using [Parcel](https://parceljs.org/) as the dev server and bundler.

## task1-chartjs

A [Chart.js](https://www.chartjs.org/) line chart comparing search interest in "Chart.js" against the general term "Chart" over time, styled as a dark, glassmorphic card with gradient-filled lines.

- `src/` — current version, built with npm + Parcel, chart data pulled into `acquisitions.js`
- `pre-npm/` — the earlier vanilla-JS attempt: a plain HTML page loading Chart.js from a CDN, rendering a bar chart of North East population figures by year

```bash
cd task1-chartjs
npm install
npm run dev    # Parcel dev server
npm run build  # production build
```

## task2-datatables

A [DataTables](https://datatables.net/) table showing Employment Location Quotient figures across North East local authorities, broken down by sector. Cells with a value of 1.0 or higher are highlighted so above-average concentrations stand out at a glance.

- `src/index.html` / `src/script.js` — table markup and the DataTables init (jQuery + DataTables loaded via CDN)
- `src/styles.css` — the teal header / highlight-cell styling

```bash
cd task2-datatables
npm install
npm run dev    # Parcel dev server
npm run build  # production build
```
