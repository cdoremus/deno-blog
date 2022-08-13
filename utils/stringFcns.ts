export function parseImportMetaUrlPath(
  importMetaUrl: string,
): string | undefined {
  return importMetaUrl.split(".")[0].split("/").pop();
}

/**
 * Sorting function for date strings in chronological order.
 *
 * @param {string} date1: date string in yyyy-MM-dd format
 * @param {string} date2: date string in yyyy-MM-dd format
 * @returns {number} zero if date1 and date2 are equal, negative
 * integer if date1 is before date2; positive integer if date1 is
 * after date2.
 */
export function postDateSorter(post1: string, post2: string): number {
  const date1 = post1.split(".")[1];
  const date2 = post2.split(".")[1];
  const dateArr1 = date1.split("-");
  const dateArr2 = date2.split("-");
  if (dateArr1[0] !== dateArr2[0]) {
    return (parseInt(dateArr1[0]) - parseInt(dateArr2[0]));
  } else if (dateArr1[1] !== dateArr2[1]) {
    return (parseInt(dateArr1[1]) - parseInt(dateArr2[1]));
  } else if (dateArr1[2] !== dateArr2[2]) {
    return (parseInt(dateArr1[2]) - parseInt(dateArr2[2]));
  } else {
    return 0;
  }
}
