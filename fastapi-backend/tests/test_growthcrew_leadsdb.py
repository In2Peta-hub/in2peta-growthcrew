import os
import tempfile
import unittest

os.environ.setdefault("OUTREACH_DATA_FILE", tempfile.mktemp(suffix=".json"))

from growthcrew.leadsdb import RESULT_COLUMNS, _clean_name, _row_to_lead, _source_sql, _tokens
from growthcrew.service import _merge_leads


def dataset_row(**overrides):
    row = dict(zip(RESULT_COLUMNS, [
        "contacts",              # dataset
        "Ms. Qiara Johnson",     # name_a
        "",                      # name_b
        "Business Manager",     # title
        "Cosmo Concierge",       # company
        "(312) 612-0082",        # phone
        "171 N Aberdeen St",     # address
        "Chicago",               # city
        "IL",                    # state
        "cosmoconcierge.com",    # website
        "Business Services",     # category
        "qiara@cosmoconcierge.com (Accept_all)",  # email_a
        "",                      # email_b
    ]))
    row.update(overrides)
    return row


class LeadDatabaseTests(unittest.TestCase):
    def test_tokens_sanitized_and_stopwords_dropped(self):
        self.assertEqual(_tokens("Auto Repair in Austin, TX!"), ["auto", "repair", "austin", "tx"])
        self.assertEqual(_tokens(""), [])
        self.assertEqual(_tokens("IN the usa"), ["usa"])

    def test_clean_name_strips_honorifics_and_parens(self):
        self.assertEqual(_clean_name("Ms. Qiara Johnson (Business Manager)"), "Qiara Johnson")
        self.assertEqual(_clean_name("Dr. Mark Phillips , Owner"), "Mark Phillips Owner")

    def test_row_to_lead_extracts_email_and_fields(self):
        lead = _row_to_lead(dataset_row(), 0)
        self.assertEqual(lead["email"], "qiara@cosmoconcierge.com")
        self.assertEqual(lead["name"], "Qiara Johnson")
        self.assertEqual(lead["title"], "Business Manager")
        self.assertEqual(lead["company"], "Cosmo Concierge")
        self.assertEqual(lead["city"], "Chicago")
        self.assertEqual(lead["phone"], "(312) 612-0082")
        self.assertEqual(lead["source"], "lead-database")
        self.assertEqual(lead["raw"]["state"], "IL")

    def test_row_to_lead_rejects_invalid_email(self):
        self.assertIsNone(_row_to_lead(dataset_row(email_a="not-an-email"), 0))
        self.assertIsNone(_row_to_lead(dataset_row(email_a="", email_b=""), 0))
        self.assertIsNone(_row_to_lead(dataset_row(email_a="no-reply@x.io"), 0))

    def test_row_to_lead_falls_back_to_sheet_two_columns(self):
        lead = _row_to_lead(dataset_row(
            name_a="", name_b="Rob Eller-Isacs",
            email_a="", email_b="rob@example.org",
            dataset="contacts",
        ), 0)
        self.assertEqual(lead["name"], "Rob Eller-Isacs")
        self.assertEqual(lead["email"], "rob@example.org")

    def test_source_sql_builds_parameter_free_predicates(self):
        sql = _source_sql(
            {"dataset": "contacts", "email_pred": "(email_a LIKE '%@%')", "inner": "SELECT 1 AS search_text, 2 AS location_text"},
            ["dentist"], ["austin"], 5,
        )
        self.assertIn("LIKE '%dentist%'", sql)
        self.assertIn("LIKE '%austin%'", sql)
        self.assertIn("LIMIT 5", sql)

    def test_merge_leads_interleaves_and_dedupes(self):
        db = [
            {"email": "a@one.com", "company": "One", "website": "one.com"},
            {"email": "b@two.com", "company": "Two", "website": ""},
            {"email": "c@three.com", "company": "Three", "website": ""},
        ]
        live = [
            {"email": "x@one.com", "company": "One LLC", "website": "https://www.one.com"},  # same company as a@one.com
            {"email": "b@two.com", "company": "Two", "website": ""},                          # duplicate email
            {"email": "d@four.com", "company": "Four", "website": ""},
        ]
        merged = _merge_leads([db, live], 10)
        self.assertEqual([lead["email"] for lead in merged], ["a@one.com", "b@two.com", "c@three.com", "d@four.com"])

    def test_merge_leads_caps_at_max_results(self):
        db = [{"email": f"db{i}@x.com", "company": f"C{i}", "website": ""} for i in range(20)]
        live = [{"email": f"live{i}@x.com", "company": f"L{i}", "website": ""} for i in range(20)]
        merged = _merge_leads([db, live], 5)
        self.assertEqual(len(merged), 5)
        self.assertEqual([lead["email"] for lead in merged], ["db0@x.com", "live0@x.com", "db1@x.com", "live1@x.com", "db2@x.com"])


if __name__ == "__main__":
    unittest.main()


def test_search_country_usa_matches_us_records_without_country_text(monkeypatch):
    import duckdb
    from growthcrew import leadsdb

    con = duckdb.connect()
    row = dataset_row(title='Founder', company='Acme Software', category='Software')
    columns = ', '.join(f"'{str(value).replace(chr(39), chr(39)*2)}' AS {key}" for key, value in row.items())
    source = {
        'dataset': 'contacts', 'email_pred': "email_a LIKE '%@%'",
        'inner': f"SELECT {columns}, 'Acme Software Founder' AS search_text, 'Chicago IL' AS location_text",
    }
    monkeypatch.setattr(leadsdb, 'is_configured', lambda: True)
    monkeypatch.setattr(leadsdb, '_connection', lambda: con)
    monkeypatch.setattr(leadsdb, 'SOURCES', [source])
    try:
        for location in ('USA', 'United States', 'U.S.A.', 'Chicago, USA'):
            assert len(leadsdb.search_dataset('software founder', location, 5)) == 1, location
        assert leadsdb.search_dataset('software founder', 'Austin, USA', 5) == []
    finally:
        con.close()
