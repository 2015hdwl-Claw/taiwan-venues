const fs = require('fs');

const allVenues = JSON.parse(fs.readFileSync('./venues-all-cities.json', 'utf8'));
const crawledResults = JSON.parse(fs.readFileSync('./batch3-crawled-photos.json', 'utf8'));

function filterValidPhotos(photos) {
  return photos.filter(url => {
    if (url.startsWith('data:')) return false;
    if (url.includes('facebook.com/tr?')) return false;
    if (url.endsWith('.svg')) return false;
    return true;
  });
}

let updateCount = 0;

crawledResults.forEach(result => {
  const validPhotos = filterValidPhotos(result.photos);
  if (validPhotos.length === 0) return;
  
  const main = validPhotos[0];
  const gallery = validPhotos.slice(1, 10);
  
  allVenues.forEach(venue => {
    if (venue.id === result.id) {
      venue.images = venue.images || {};
      venue.images.main = main;
      venue.images.gallery = gallery;
      venue.images.source = result.url;
      venue.images.verified = true;
      venue.images.verifiedAt = new Date().toISOString();
      venue.images.updateReason = '批量更新：補充照片';
      updateCount++;
      console.log(`[${venue.id}] ${venue.name} - ${gallery.length} 張`);
    }
  });
});

fs.writeFileSync('./venues-all-cities.json', JSON.stringify(allVenues, null, 2));
console.log(`\n第三批更新完成: ${updateCount} 筆`);
