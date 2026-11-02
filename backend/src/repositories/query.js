export async function filas(tx, sql, params = []) {
    return (await tx.query(sql, params)).rows;
}

export async function una(tx, sql, params = []) {
    return (await filas(tx, sql, params))[0] ?? null;
}
