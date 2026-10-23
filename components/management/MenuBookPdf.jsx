import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const SIZES = { LETTER: [612,792], A4: [595.28,841.89], TABLOID: [792,1224] };
const clean = value => String(value || '').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const dollars = cents => `$${(Number(cents || 0)/100).toFixed(2)}`;
const getId = value => String(value?._id || value?.id || value || '');

// Estimate each row in points before creating pages. react-pdf also enforces no row splits.
// Text lengths and column widths influence the estimate, unlike fixed row-count pagination.
export function paginateMenu(groups, options) {
  const { size='LETTER', orientation='portrait', showPhotos=true, showDescriptions=true,
    logo='', titleMode='first-page', title='Restaurant Menu', density='balanced', manualBreaks=[] } = options;
  const paper = SIZES[size] || SIZES.LETTER;
  const height = orientation === 'landscape' ? paper[0] : paper[1];
  const width = orientation === 'landscape' ? paper[1] : paper[0];
  const scale = density === 'compact' ? .85 : density === 'spacious' ? 1.15 : 1;
  const contentWidth = width - 76;
  const headerHeight = (pageIndex) => 34 + (logo ? 49 : 0) + ((titleMode === 'every-page' || pageIndex === 0) ? 49 : 0);
  const available = pageIndex => height - 46 - 42 - headerHeight(pageIndex);
  const pages = [[]];
  let used = 0;
  const next = () => { if (pages[pages.length - 1].length) pages.push([]); used = 0; };
  for (const group of groups) {
    if (!group.visible || !group.items?.length) continue;
    const columns = Math.max(1, Math.min(4, Number(group.columns) || 1));
    const rows = [];
    for (let i=0;i<group.items.length;i+=columns) rows.push(group.items.slice(i,i+columns));
    let firstInCategory = true;
    for (const row of rows) {
      if (row.some(item => manualBreaks.includes(getId(item))) && used > 0) next();
      const cellWidth = (contentWidth - (columns-1)*12) / columns;
      const imgHeight = showPhotos ? (columns === 1 ? 80 : cellWidth) : 0;
      const textWidth = columns === 1 && showPhotos ? cellWidth - 95 : cellWidth;
      const fontSize = Math.max(8, (columns >= 4 ? 8 : columns === 3 ? 9 : 10) * scale);
      const lineChars = Math.max(12, Math.floor(textWidth / (fontSize * .52)));
      const rowHeight = Math.max(...row.map(item => {
        const nameLines = Math.ceil((String(item.name || '').length + 9) / lineChars);
        const descLines = showDescriptions ? Math.ceil(clean(item.description).length / lineChars) : 0;
        const textHeight = nameLines * fontSize * 1.35 + descLines * (fontSize - 1) * 1.32 + 13;
        return columns === 1 ? Math.max(imgHeight,textHeight) + 12 : imgHeight + textHeight + 15;
      }));
      const categoryHeight = firstInCategory ? 37 : 0;
      if (used > 0 && used + rowHeight + categoryHeight > available(pages.length-1)) next();
      // A category label repeats when its continuation starts on a new page.
      const last = pages[pages.length-1];
      const previous = last[last.length-1];
      const showHeading = firstInCategory || !previous || previous.categoryId !== group.categoryId;
      last.push({ categoryId: group.categoryId, categoryLabel: group.categoryLabel, columns, items: row, heading: showHeading });
      used += rowHeight + (showHeading ? 37 : 0);
      firstInCategory = false;
    }
  }
  return pages;
}

const styles = StyleSheet.create({
  page: { paddingTop: 24, paddingBottom: 42, paddingHorizontal: 38, fontFamily: 'Helvetica' },
  header: { alignItems: 'center', borderBottomWidth: .8, paddingBottom: 8, marginBottom: 12 },
  logo: { height: 44, width: 175, objectFit: 'contain', marginBottom: 3 },
  title: { fontSize: 19, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  subtitle: { fontSize: 7, letterSpacing: 1.2 },
  category: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginTop: 8, marginBottom: 9, paddingBottom: 5, borderBottomWidth: .7 },
  row: { flexDirection: 'row', marginBottom: 12 },
  photo: { objectFit: 'cover', borderRadius: 3 },
  name: { fontFamily: 'Helvetica-Bold' },
  price: { fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  desc: { marginTop: 4, lineHeight: 1.35 },
  footer: { position: 'absolute', bottom: 17, left: 38, right: 38, textAlign: 'center', fontSize: 8 },
});

export default function MenuBookPdf({ groups, options }) {
  const { size='LETTER', orientation='portrait', background='', colors,
    logo='', title='Restaurant Menu', titleMode='first-page', showPhotos=true,
    showDescriptions=true, density='balanced' } = options;
  const pages = paginateMenu(groups, options);
  const scale = density === 'compact' ? .85 : density === 'spacious' ? 1.15 : 1;
  const paper = SIZES[size] || SIZES.LETTER;
  const pageWidth = orientation === 'landscape' ? paper[1] : paper[0];
  const cellContentWidth = pageWidth - 76;
  return <Document title={title} author="OrderXO" subject="Restaurant menu book">
    {pages.map((rows, index) => <Page key={index} size={size === 'LETTER' ? 'LETTER' : size === 'A4' ? 'A4' : [792,1224]} orientation={orientation} style={[styles.page, { backgroundColor: background || colors.bg, color: colors.ink }]} wrap={false}>
      <View style={[styles.header, { borderBottomColor: colors.accent }]}>
        {logo ? <Image src={logo} style={styles.logo}/> : null}
        {(titleMode === 'every-page' || index === 0) ? <>
          <Text style={[styles.title, {color:colors.accent}]}>{title}</Text>
          <Text style={styles.subtitle}>FRESHLY PREPARED · MADE TO ORDER</Text>
        </> : null}
      </View>
      {rows.map((row, rowIndex) => {
        const cols = row.columns;
        const gap = 12;
        const cellWidth = (cellContentWidth - (cols-1)*gap)/cols;
        const fontSize = Math.max(8,(cols >= 4 ? 8 : cols === 3 ? 9 : 10)*scale);
        return <View key={`${row.categoryId}-${rowIndex}`} wrap={false}>
          {row.heading ? <Text style={[styles.category, {color:colors.accent,borderBottomColor:colors.accent}]}>{row.categoryLabel}</Text> : null}
          <View style={styles.row}>
            {row.items.map((item, itemIndex) => <View key={getId(item)} style={{width:cellWidth, marginRight:itemIndex===row.items.length-1?0:gap, flexDirection:cols===1?'row':'column'}}>
              {showPhotos && item.image ? <Image src={item.image} style={[styles.photo, cols===1?{width:80,height:80,marginRight:12}:{width:cellWidth,height:cellWidth,marginBottom:7}]}/> : null}
              <View style={{flex:1,minWidth:0}}>
                <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <Text style={[styles.name,{fontSize,flex:1,paddingRight:4}]}>{item.name}</Text>
                  <Text style={[styles.price,{fontSize:fontSize-.2}]}>{dollars(item.priceCents)}</Text>
                </View>
                {showDescriptions ? <Text style={[styles.desc,{fontSize:Math.max(7,fontSize-1),color:colors.ink}]}>{clean(item.description)}</Text> : null}
              </View>
            </View>)}
          </View>
        </View>;
      })}
      <Text style={styles.footer}>{index+1} / {pages.length}</Text>
    </Page>)}
  </Document>;
}
