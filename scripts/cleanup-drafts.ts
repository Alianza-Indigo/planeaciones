import { deleteExpiredDrafts } from "../lib/drafts/expire-drafts";

deleteExpiredDrafts()
  .then((result) => {
    console.log(`Deleted ${result.count} expired drafts`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
