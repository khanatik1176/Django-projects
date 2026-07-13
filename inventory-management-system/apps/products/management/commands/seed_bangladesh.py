from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import AccountStatus, Role, User
from apps.accounts.user_management import UserManagementService
from apps.products.models import Brand, Category, Product, Supplier
from apps.inventory.models import Warehouse, Stock, StockBatch
from apps.inventory.services import InventoryService
from apps.orders.models import PurchaseOrder, PurchaseOrderItem, SalesOrder, SalesOrderItem, Customer
from apps.orders.services import PurchaseOrderService, SalesOrderService


class Command(BaseCommand):
    help = "Seed realistic Bangladesh market data for Bhandar IMS"

    @transaction.atomic
    def handle(self, *args, **options):
        UserManagementService.ensure_default_roles()
        admin_role = Role.objects.get(code="ADMIN")
        manager_role = Role.objects.get(code="MANAGER")
        warehouse_role = Role.objects.get(code="WAREHOUSE")
        viewer_role = Role.objects.get(code="VIEWER")

        user, created = User.objects.get_or_create(
            email="admin@bhandar.bd",
            defaults={
                "first_name": "Rafiq",
                "last_name": "Ahmed",
                "phone": "01711223344",
                "is_staff": True,
                "is_superuser": True,
                "role": admin_role,
                "account_status": AccountStatus.ACTIVE,
                "is_active": True,
            },
        )
        if created:
            user.set_password("Admin@12345")
            user.save()
            self.stdout.write(self.style.SUCCESS("Created admin@bhandar.bd / Admin@12345"))
        else:
            user.role = admin_role
            user.account_status = AccountStatus.ACTIVE
            user.is_active = True
            user.save()

        team_users = [
            ("ops@bhandar.bd", "Nusrat", "Chowdhury", "01833445566", manager_role, AccountStatus.ACTIVE, "Ops@2026"),
            ("warehouse@bhandar.bd", "Imran", "Hossain", "01922334455", warehouse_role, AccountStatus.ACTIVE, "Wh@2026"),
            ("sales@bhandar.bd", "Farhana", "Begum", "01611223344", manager_role, AccountStatus.ACTIVE, "Sales@2026"),
            ("pending@bhandar.bd", "Tanvir", "Islam", "01555667788", viewer_role, AccountStatus.PENDING, "Pending@2026"),
        ]
        for email, first, last, phone, role, status, pwd in team_users:
            u, u_created = User.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": first,
                    "last_name": last,
                    "phone": phone,
                    "role": role,
                    "account_status": status,
                    "is_active": status == AccountStatus.ACTIVE,
                },
            )
            if u_created:
                u.set_password(pwd)
                u.save()

        categories = {
            "Grocery & Staples": "Rice, dal, flour, oil and daily kitchen essentials",
            "Beverages": "Tea, coffee, soft drinks and juices",
            "Personal Care": "Soap, shampoo, toothpaste and hygiene",
            "Household & Cleaning": "Detergent, dishwash and home care",
            "Snacks & Biscuits": "Chips, biscuits, noodles and confectionery",
            "Spices & Masala": "Radhuni, Pran and local spice mixes",
        }
        category_objs = {}
        for name, desc in categories.items():
            obj, _ = Category.objects.get_or_create(
                name=name,
                defaults={"description": desc, "is_active": True, "created_by": user, "updated_by": user},
            )
            category_objs[name] = obj

        brands = {
            "Pran": "PRAN-RFL Group, Narayanganj",
            "ACI": "ACI Consumer Brands, Dhaka",
            "Square Toiletries": "Square Consumer Products Ltd",
            "Unilever Bangladesh": "Unilever BD Ltd, Gulshan",
            "Fresh": "Fresh Food Products, Dhaka",
            "Radhuni": "Square Food & Beverage",
            "Ispahani": "Ispahani Tea, Chattogram",
            "Bashundhara": "Bashundhara Group, Dhaka",
            "Meril": "Square Toiletries",
            "Bengal Meat": "Bengal Meat Processing",
            "Olympic": "Olympic Industries, Tongi",
            "Dan Cake": "Dan Foods Bangladesh",
        }
        brand_objs = {}
        for name, desc in brands.items():
            obj, _ = Brand.objects.get_or_create(
                name=name,
                defaults={"description": desc, "is_active": True, "created_by": user, "updated_by": user},
            )
            brand_objs[name] = obj

        suppliers_data = [
            ("Meghna Distributors", "Abdul Karim", "sales@meghnadist.bd", "01811001122", "69 Motijheel C/A, Dhaka-1000"),
            ("Agrabad Trading Corporation", "Shahana Rahman", "order@agrabadtc.bd", "01822003344", "41 Agrabad Access Road, Chattogram"),
            ("Uttara Wholesale Hub", "Rashed Khan", "supply@uttarahub.bd", "01733004455", "Sector 7, Uttara, Dhaka"),
            ("Khulna Food Mart", "Mizanur Rahman", "procure@khulnafood.bd", "01944005566", "KDA Avenue, Khulna"),
            ("Sylhet Hills Trading", "Fahmida Akter", "hello@sylhettrade.bd", "01655006677", "Zindabazar, Sylhet"),
            ("Gazipur Industrial Supply", "Jamal Uddin", "dispatch@gazipursupply.bd", "01566007788", "Konabari, Gazipur"),
        ]
        supplier_objs = []
        for name, contact, email, phone, address in suppliers_data:
            obj, _ = Supplier.objects.get_or_create(
                name=name,
                defaults={
                    "contact_person": contact,
                    "email": email,
                    "phone": phone,
                    "address": address,
                    "is_active": True,
                    "created_by": user,
                    "updated_by": user,
                },
            )
            supplier_objs.append(obj)

        warehouses_data = [
            ("Motijheel Central Depot", "DHK-MTL", "69-71 Motijheel C/A, Dhaka-1000", "Kamal Hossain", "01700111222", True),
            ("Uttara Distribution Hub", "DHK-UTT", "House 14, Road 7, Sector 4, Uttara", "Sabbir Ahmed", "01700222333", False),
            ("Chattogram Port Warehouse", "CTG-PRT", "Patenga Access Road, Chattogram", "Nazmul Hasan", "01800333444", False),
            ("Gazipur Fulfillment Center", "GAZ-FFC", "Bhawal Mirzapur, Gazipur", "Rafiqul Islam", "01900444555", False),
            ("Sylhet Regional Store", "SYL-REG", "Ambarkhana, Sylhet", "Mousumi Das", "01600555666", False),
        ]
        warehouse_objs = []
        for name, code, address, contact, phone, is_default in warehouses_data:
            obj, _ = Warehouse.objects.update_or_create(
                name=name,
                defaults={
                    "code": code,
                    "address": address,
                    "contact_person": contact,
                    "phone": phone,
                    "is_default": is_default,
                    "is_active": True,
                    "created_by": user,
                    "updated_by": user,
                },
            )
            warehouse_objs.append(obj)

        products_data = [
            ("PRAN Miniket Rice 25kg", "RIC-PRN-MIN-25", "8941001001001", "Grocery & Staples", "Pran", 0, 1850, 2120, "bag"),
            ("Fresh Nazirshail Rice 50kg", "RIC-FRS-NAZ-50", "8941001001002", "Grocery & Staples", "Fresh", 0, 3380, 3720, "bag"),
            ("Radhuni Moshur Dal 1kg", "DAL-RAD-MOS-1", "8941001001003", "Grocery & Staples", "Radhuni", 1, 98, 125, "pcs"),
            ("Fresh Mustard Oil 900ml", "OIL-FRS-MUS-900", "8941001001004", "Grocery & Staples", "Fresh", 2, 198, 245, "bottle"),
            ("ACI Pure Salt 1kg", "SAL-ACI-1", "8941001001005", "Grocery & Staples", "ACI", 0, 34, 42, "pcs"),
            ("Ispahani Mirzapore Tea 400g", "TEA-ISP-MIR-400", "8941001001006", "Beverages", "Ispahani", 4, 188, 235, "pcs"),
            ("Pran Frooto Mango 250ml", "BEV-PRN-FRT-250", "8941001001007", "Beverages", "Pran", 0, 19, 28, "pcs"),
            ("Bashundhara Mineral Water 1.5L", "BEV-BSH-MIN-15", "8941001001008", "Beverages", "Bashundhara", 3, 28, 38, "pcs"),
            ("Lux Botanicals Soap 100g", "PC-LUX-SOAP-100", "8941001001009", "Personal Care", "Unilever Bangladesh", 1, 52, 68, "pcs"),
            ("Sunsilk Black Shine 180ml", "PC-SUN-SHP-180", "8941001001010", "Personal Care", "Unilever Bangladesh", 1, 148, 195, "pcs"),
            ("Meril Baby Lotion 100ml", "PC-MER-BAB-100", "8941001001011", "Personal Care", "Meril", 2, 112, 148, "pcs"),
            ("Vim Dishwash Liquid 500ml", "HH-VIM-DW-500", "8941001001012", "Household & Cleaning", "Unilever Bangladesh", 1, 98, 128, "pcs"),
            ("ACI Aerosol 300ml", "HH-ACI-AER-300", "8941001001013", "Household & Cleaning", "ACI", 0, 215, 268, "pcs"),
            ("Pran Potato Crackers 25g", "SNK-PRN-CRK-25", "8941001001014", "Snacks & Biscuits", "Pran", 0, 11, 18, "pcs"),
            ("Olympic Digestive Biscuit 80g", "SNK-OLY-DIG-80", "8941001001015", "Snacks & Biscuits", "Olympic", 5, 22, 32, "pcs"),
            ("Dan Cake Chocolate Muffin", "SNK-DAN-MUF-45", "8941001001016", "Snacks & Biscuits", "Dan Cake", 3, 28, 38, "pcs"),
            ("Radhuni Chicken Masala 50g", "SPC-RAD-CHK-50", "8941001001017", "Spices & Masala", "Radhuni", 1, 46, 62, "pcs"),
            ("Radhuni Garam Masala 40g", "SPC-RAD-GAR-40", "8941001001018", "Spices & Masala", "Radhuni", 4, 38, 52, "pcs"),
            ("Pran Tomato Ketchup 320g", "GRC-PRN-KET-320", "8941001001019", "Grocery & Staples", "Pran", 0, 95, 125, "bottle"),
            ("Bengal Meat Chicken Franks 340g", "FZN-BMT-FRK-340", "8941001001020", "Grocery & Staples", "Bengal Meat", 5, 285, 345, "pack"),
            ("ACI Pure Turmeric 200g", "SPC-ACI-TUR-200", "8941001001021", "Spices & Masala", "ACI", 2, 72, 95, "pcs"),
            ("Pran Mango Pickle 400g", "GRC-PRN-PKL-400", "8941001001022", "Grocery & Staples", "Pran", 1, 88, 115, "jar"),
            ("Square Harpic 750ml", "HH-SQR-HRP-750", "8941001001023", "Household & Cleaning", "ACI", 3, 165, 210, "bottle"),
            ("Pran Instant Noodles 62g", "SNK-PRN-NOD-62", "8941001001024", "Snacks & Biscuits", "Pran", 0, 14, 22, "pcs"),
        ]

        product_objs = []
        for name, sku, barcode, cat, brand, sup_idx, cost, sell, uom in products_data:
            obj, _ = Product.objects.update_or_create(
                sku=sku,
                defaults={
                    "name": name,
                    "barcode": barcode,
                    "category": category_objs[cat],
                    "brand": brand_objs[brand],
                    "supplier": supplier_objs[sup_idx],
                    "description": f"{name} — distributed across Bangladesh retail & wholesale channels.",
                    "unit_of_measure": uom,
                    "cost_price": Decimal(str(cost)),
                    "selling_price": Decimal(str(sell)),
                    "is_active": True,
                    "created_by": user,
                    "updated_by": user,
                },
            )
            product_objs.append(obj)

        if not Stock.objects.exists():
            stock_plan = [
                (0, 0, 240), (0, 1, 120), (1, 0, 380), (1, 1, 160),
                (2, 0, 520), (3, 0, 190), (4, 0, 600), (5, 0, 280),
                (6, 0, 840), (6, 2, 420), (7, 0, 310), (8, 0, 220),
                (9, 0, 145), (10, 0, 95), (11, 0, 180), (12, 0, 75),
                (13, 0, 1200), (13, 1, 650), (14, 0, 480), (15, 0, 320),
                (16, 0, 260), (17, 0, 190), (18, 0, 140), (19, 0, 85),
                (20, 0, 110), (21, 0, 95), (22, 0, 70), (23, 0, 900),
                (0, 3, 80), (5, 4, 60),
            ]
            for p_idx, w_idx, qty in stock_plan:
                InventoryService.receive_stock(
                    product_id=product_objs[p_idx].id,
                    warehouse_id=warehouse_objs[w_idx].id,
                    quantity=qty,
                    user=user,
                    reference_number="OPENING-BD-2026",
                    notes="Opening stock — Bangladesh seed",
                )

            for stock in Stock.objects.filter(
                product__sku__in=["SNK-PRN-CRK-25", "PC-SUN-SHP-180", "HH-ACI-AER-300", "RIC-PRN-MIN-25"]
            ):
                stock.reorder_level = Decimal("80")
                stock.save(update_fields=["reorder_level", "updated_at"])

        perishable_catalog = {
            "BEV-PRN-FRT-250": 90,
            "SNK-DAN-MUF-45": 14,
            "FZN-BMT-FRK-340": 30,
            "OIL-FRS-MUS-900": 180,
            "GRC-PRN-PKL-400": 365,
            "PC-MER-BAB-100": 730,
        }
        for sku, shelf_days in perishable_catalog.items():
            Product.objects.filter(sku=sku).update(
                is_perishable=True,
                shelf_life_days=shelf_days,
            )

        if not StockBatch.objects.exists():
            today = timezone.localdate()
            expiry_demo = [
                ("BEV-PRN-FRT-250", 3, 120),
                ("SNK-DAN-MUF-45", 5, 85),
                ("FZN-BMT-FRK-340", 2, 40),
                ("OIL-FRS-MUS-900", 6, 45),
            ]
            for sku, days_left, qty in expiry_demo:
                product = Product.objects.filter(sku=sku).first()
                if not product:
                    continue
                stock = Stock.objects.filter(product=product).order_by("-quantity").first()
                if not stock:
                    continue
                StockBatch.objects.create(
                    stock=stock,
                    product=product,
                    warehouse=stock.warehouse,
                    batch_number=f"LOT-{sku[-4:]}-{days_left}D",
                    quantity=min(Decimal(str(qty)), stock.quantity),
                    expiry_date=today + timedelta(days=days_left),
                    created_by=user,
                    updated_by=user,
                )

        if not PurchaseOrder.objects.exists():
            po = PurchaseOrder.objects.create(
                po_number=PurchaseOrderService._generate_po_number(),
                supplier=supplier_objs[0],
                warehouse=warehouse_objs[0],
                order_date=timezone.localdate(),
                expected_date=timezone.localdate(),
                notes="Monthly FMCG replenishment — Motijheel depot",
                created_by=user,
                updated_by=user,
            )
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                product=product_objs[0],
                quantity_ordered=Decimal("100"),
                unit_cost=product_objs[0].cost_price,
                created_by=user,
                updated_by=user,
            )
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                product=product_objs[13],
                quantity_ordered=Decimal("500"),
                unit_cost=product_objs[13].cost_price,
                created_by=user,
                updated_by=user,
            )
            PurchaseOrderService.submit(purchase_order_id=po.id, user=user)

        if not SalesOrder.objects.exists():
            so = SalesOrder.objects.create(
                so_number=SalesOrderService._generate_so_number(),
                customer_name="Rahim Store — Gulshan",
                customer_email="rahim.store@gmail.com",
                customer_phone="01788776655",
                warehouse=warehouse_objs[0],
                order_date=timezone.localdate(),
                notes="Retail replenishment order — Gulshan branch",
                created_by=user,
                updated_by=user,
            )
            SalesOrderItem.objects.create(
                sales_order=so,
                product=product_objs[6],
                quantity_ordered=Decimal("48"),
                unit_price=product_objs[6].selling_price,
                created_by=user,
                updated_by=user,
            )
            SalesOrderItem.objects.create(
                sales_order=so,
                product=product_objs[8],
                quantity_ordered=Decimal("24"),
                unit_price=product_objs[8].selling_price,
                created_by=user,
                updated_by=user,
            )

        if not Customer.objects.exists():
            demo_customers = [
                ("Karim Bhai — Mohammadpur", "01711223399", "Block C, Mohammadpur", Decimal("1250"), Decimal("5000")),
                ("Salma Apa — Dhanmondi", "01822334455", "Road 27, Dhanmondi", Decimal("850"), Decimal("3000")),
                ("Raju Store — Mirpur", "01933445566", "Section 10, Mirpur", Decimal("0"), Decimal("10000")),
                ("Mina Khala — Uttara", "01644556677", "Sector 7, Uttara", Decimal("2100"), Decimal("5000")),
            ]
            for name, phone, address, balance, limit in demo_customers:
                Customer.objects.create(
                    name=name,
                    phone=phone,
                    address=address,
                    credit_balance=balance,
                    credit_limit=limit,
                    is_active=True,
                    notes="Demo udhar customer",
                )
            self.stdout.write(self.style.SUCCESS("Created demo udhar customers"))

        self.stdout.write(self.style.SUCCESS("Bangladesh market data seeded successfully."))
        self.stdout.write("Admin: admin@bhandar.bd / Admin@12345")
        self.stdout.write("Team: ops@bhandar.bd / Ops@2026 | warehouse@bhandar.bd / Wh@2026")
        self.stdout.write("Pending signup test: pending@bhandar.bd / Pending@2026 (cannot login until approved)")
