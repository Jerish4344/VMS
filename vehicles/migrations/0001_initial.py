# Generated by Django 5.2.1 on 2025-05-13 10:15

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='VehicleType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50)),
                ('description', models.TextField(blank=True)),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='Vehicle',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('make', models.CharField(max_length=100)),
                ('model', models.CharField(max_length=100)),
                ('year', models.PositiveIntegerField()),
                ('license_plate', models.CharField(max_length=20, unique=True)),
                ('vin', models.CharField(max_length=50, unique=True, verbose_name='Vehicle Identification Number')),
                ('color', models.CharField(max_length=50)),
                ('seating_capacity', models.PositiveIntegerField(default=1)),
                ('current_odometer', models.PositiveIntegerField(default=0, help_text='Current odometer reading in km')),
                ('fuel_type', models.CharField(max_length=50)),
                ('fuel_capacity', models.DecimalField(decimal_places=2, help_text='Fuel tank capacity in liters', max_digits=6)),
                ('acquisition_date', models.DateField()),
                ('status', models.CharField(choices=[('available', 'Available'), ('in_use', 'In Use'), ('maintenance', 'Under Maintenance'), ('retired', 'Retired')], default='available', max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('image', models.ImageField(blank=True, null=True, upload_to='vehicles/')),
                ('vehicle_type', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='vehicles.vehicletype')),
            ],
            options={
                'ordering': ['license_plate'],
            },
        ),
    ]
